import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class ExecuteSyntheticDto {
  @IsString()
  @Length(3, 80)
  nextValue!: string;

  @IsOptional()
  @IsBoolean()
  simulateFailure?: boolean;
}
