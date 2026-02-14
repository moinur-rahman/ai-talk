import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { FileService } from './file.service.js';
import { GetFilesMetadataQueryDto } from './dto/get-files-metadata-query.dto.js';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const userId = req.user.id;

    const fileMetadata = await this.fileService.uploadFile(file, userId);

    return {
      data: fileMetadata,
      message: 'File uploaded successfully',
    };
  }

  @Get('download/:id')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const file = await this.fileService.downloadFileById(id);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.size);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.fileName}"`,
    );

    file.stream.pipe(res);
  }

  @Get('metadata')
  async getFilesMetadata(@Query() query: GetFilesMetadataQueryDto) {
    const results = await this.fileService.getMultipleFilesMetadata(query.ids);

    return {
      data: results,
      message: 'File metadata fetched successfully',
    };
  }
}
