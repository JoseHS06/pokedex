import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isValidObjectId, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class PokemonService {

  private defaultLimit: number;

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,

    private readonly configService: ConfigService
  ){
    this.defaultLimit = this.configService.get<number>('defaultLimit') || 10;
  }

  async create(createPokemonDto: CreatePokemonDto): Promise<Pokemon> {
    
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
    
    try {

      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon.save();

    } catch (error) {

      this.handleExceptions(error);

    }
    throw new InternalServerErrorException('Unexpected error during Pokemon creation');
  }

  findAll(paginationDto: PaginationDto) {

    const { limit = this.defaultLimit, offset = 0 } = paginationDto;

    return this.pokemonModel.find()
      .limit(limit)
      .skip(offset)
      .sort({ no: 1 })
      .select('-__v')
  }

  async findOne(term: string): Promise<Pokemon> {

    if(!term){
      throw new BadRequestException('Search term is required');
    }

    const query: { name?: string, no?: string } = isNaN(+term)
      ? { name: term.toLowerCase() }
      : { no: term.trim() };

      const pokemon = await this.pokemonModel.findOne(query) || 
      (isValidObjectId(term) ? await this.pokemonModel.findById(term) : null);

      if( !pokemon ) {
        throw new NotFoundException(`Pokemon with term ${term} not found`);
      }

      return pokemon;

  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {

    if(!term){
      throw new BadRequestException('Search term is required');
    }

    const pokemon = await this.findOne(term);

    if(updatePokemonDto.name) {

      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();

      try {

        await pokemon.updateOne(updatePokemonDto);
        return { ...pokemon.toJSON(), ...updatePokemonDto };
        
      } catch (error) {
 
        this.handleExceptions(error);
        
      }
    }

  }

  async remove(id: string) {

    const result = await this.pokemonModel.findByIdAndDelete(id);
    return result;

  }

  private handleExceptions(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(`Pokemon exists in db ${JSON.stringify(error)}`);
    }

    console.log(error);
    throw new InternalServerErrorException(`Can't create Pokemon - Check server logs`);
  }
}
