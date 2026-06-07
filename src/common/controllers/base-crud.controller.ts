export abstract class BaseCrudController<Entity, CreateDto, UpdateDto> {
  constructor(protected readonly service: any) {}

  abstract create(createDto: CreateDto): Promise<Entity>;
  abstract findAll(page?: number, limit?: number, status?: string): Promise<any>;
  abstract findOne(id: string): Promise<Entity>;
  abstract findByIdentification?(identification: string): Promise<Entity>;
  abstract update(id: string, updateDto: UpdateDto): Promise<Entity>;
  abstract remove(id: string): Promise<void>;
  abstract restore?(id: string): Promise<Entity>;
}
