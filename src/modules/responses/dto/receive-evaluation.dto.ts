import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { QuestionAnswerDto } from './question-answer.dto';

export class ReceiveEvaluationDto {
  @IsUUID()
  evaluatedUserId: string;

  @IsUUID()
  evaluatorUserId: string;

  @IsUUID()
  evaluatedPersonId: string;

  @IsUUID()
  surveyId: string;

  @IsInt()
  @Min(1)
  surveyVersion: number;

  @IsInt()
  @Min(1)
  attempt: number;

  @IsDateString()
  submittedAt: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswerDto)
  answers: QuestionAnswerDto[];
}
