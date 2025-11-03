import { IsUUID, IsNotEmpty } from 'class-validator';

export class AddFavoriteDto {
  @IsNotEmpty()
  @IsUUID()
  coin_id: string;
}
