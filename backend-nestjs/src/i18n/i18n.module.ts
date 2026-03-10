import { Global, Module } from '@nestjs/common';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import * as path from 'path';

@Global()
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/'),
        watch: process.env.NODE_ENV !== 'production',
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        { use: HeaderResolver, options: ['x-user-language', 'accept-language'] },
        AcceptLanguageResolver,
      ],
      typesOutputPath: path.join(
        process.cwd(),
        'backend-nestjs',
        'src',
        'generated',
        'i18n.generated.ts',
      ),
      throwOnMissingKey: false,
    }),
  ],
  exports: [I18nModule],
})
export class AppI18nModule {}

