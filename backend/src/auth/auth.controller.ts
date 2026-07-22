import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { StellarAuthGuard } from '../common/guards/stellar-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('challenge')
  @ApiOperation({ summary: 'Generate authentication challenge' })
  generateChallenge(@Body('publicKey') publicKey?: string) {
    return this.authService.generateChallenge(publicKey);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify wallet signature and get JWT' })
  async verify(@Body() signInDto: SignInDto) {
    return this.authService.verifySignature(signInDto);
  }

  @Get('me')
  @UseGuards(StellarAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  async getProfile(@CurrentUser() user: { stellarAddress: string }) {
    return this.authService.validateUser(user.stellarAddress);
  }
}
