import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../../common/services/logger.service';
import { TtlCache } from './ttl-cache';
import { HierarchyNodeInfo, PersonProfile, SurveyStructure } from './interfaces';

const SURVEY_STRUCTURE_TTL_MS = 5 * 60 * 1000;
const HIERARCHY_TTL_MS = 30 * 60 * 1000;

interface DescendantsResponse {
  descendantIds: string[];
}

interface AncestorsResponse {
  ancestorIds: string[];
}

interface HierarchyNodesResponse {
  nodes: HierarchyNodeInfo[];
}

interface PersonProfilesResponse {
  people: PersonProfile[];
}

@Injectable()
export class AdminClientService {
  private readonly surveyStructureCache = new TtlCache<SurveyStructure>(SURVEY_STRUCTURE_TTL_MS);
  private readonly descendantsCache = new TtlCache<string[]>(HIERARCHY_TTL_MS);
  private readonly ancestorsCache = new TtlCache<string[]>(HIERARCHY_TTL_MS);
  private readonly hierarchyNodeCache = new TtlCache<HierarchyNodeInfo>(HIERARCHY_TTL_MS);
  private readonly personProfileCache = new TtlCache<PersonProfile>(HIERARCHY_TTL_MS);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async getSurveyStructure(surveyId: string): Promise<SurveyStructure> {
    const cached = this.surveyStructureCache.get(surveyId);
    if (cached) {
      return cached;
    }

    const structure = await this.get<SurveyStructure>(`/surveys/${surveyId}/structure`);
    this.surveyStructureCache.set(surveyId, structure);
    return structure;
  }

  async getHierarchyDescendants(nodeId: string): Promise<string[]> {
    const cached = this.descendantsCache.get(nodeId);
    if (cached) {
      return cached;
    }

    const response = await this.get<DescendantsResponse>(`/hierarchy/${nodeId}/descendants`);
    const descendantIds = response.descendantIds ?? [];
    this.descendantsCache.set(nodeId, descendantIds);
    return descendantIds;
  }

  /** Needed to propagate analytics summaries up the hierarchy (centro -> distrito -> regional -> ministerio). */
  async getHierarchyAncestors(nodeId: string): Promise<string[]> {
    const cached = this.ancestorsCache.get(nodeId);
    if (cached) {
      return cached;
    }

    const response = await this.get<AncestorsResponse>(`/hierarchy/${nodeId}/ancestors`);
    const ancestorIds = response.ancestorIds ?? [];
    this.ancestorsCache.set(nodeId, ancestorIds);
    return ancestorIds;
  }

  /** Resolves node display names and types, needed because the engine has no hierarchy table. */
  async getHierarchyNodes(nodeIds: string[]): Promise<HierarchyNodeInfo[]> {
    const uniqueIds = Array.from(new Set(nodeIds));
    const result: HierarchyNodeInfo[] = [];
    const missing: string[] = [];

    for (const id of uniqueIds) {
      const cached = this.hierarchyNodeCache.get(id);
      if (cached) {
        result.push(cached);
      } else {
        missing.push(id);
      }
    }

    if (missing.length > 0) {
      const response = await this.get<HierarchyNodesResponse>('/hierarchy/nodes', {
        ids: missing.join(','),
      });
      for (const node of response.nodes ?? []) {
        this.hierarchyNodeCache.set(node.id, node);
        result.push(node);
      }
    }

    return result;
  }

  /** Resolves teacher/person display names and cédula for reports, since the engine only stores person UUIDs. */
  async getPersonProfiles(personIds: string[]): Promise<PersonProfile[]> {
    const uniqueIds = Array.from(new Set(personIds));
    const result: PersonProfile[] = [];
    const missing: string[] = [];

    for (const id of uniqueIds) {
      const cached = this.personProfileCache.get(id);
      if (cached) {
        result.push(cached);
      } else {
        missing.push(id);
      }
    }

    if (missing.length > 0) {
      const response = await this.get<PersonProfilesResponse>('/people', {
        ids: missing.join(','),
      });
      for (const person of response.people ?? []) {
        this.personProfileCache.set(person.id, person);
        result.push(person);
      }
    }

    return result;
  }

  private async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const baseUrl = this.configService.get<string>('app.adminServiceUrl') ?? '';
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<T>(`${baseUrl}${path}`, {
          params,
          headers: {
            'x-internal-api-key': this.configService.get<string>('app.internalApiKey') ?? '',
          },
        }),
      );
      return data;
    } catch (error) {
      this.logger.error(
        `admin-ms request failed: GET ${path}`,
        error instanceof Error ? error.stack : undefined,
        AdminClientService.name,
      );
      throw error;
    }
  }
}
