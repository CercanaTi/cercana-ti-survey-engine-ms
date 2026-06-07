import { Type } from 'class-transformer';
import { IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';
import { QuestionAnswerDto } from './question-answer.dto';

export class SaveDraftDto {
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswerDto)
  answers: QuestionAnswerDto[];
}
