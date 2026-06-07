import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class RubricScoreDto {
  @IsNumber()
  criteriaIndex: number;

  @IsNumber()
  levelIndex: number;

  @IsNumber()
  score: number;
}

export class QuestionAnswerDto {
  @IsUUID()
  questionId: string;

  @IsUUID()
  sectionId: string;

  @IsString()
  questionType: string;

  @IsOptional()
  @IsString()
  textValue?: string;

  @IsOptional()
  @IsNumber()
  numericValue?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  selectedOptionIds?: string[];

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricScoreDto)
  rubricScores?: RubricScoreDto[];
}
