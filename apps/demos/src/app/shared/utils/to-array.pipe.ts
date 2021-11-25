import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toArray'
})
export class ToArrayPipe implements PipeTransform {
  transform(value: number | string): any[] {
    if (typeof value === 'number') {
      return new Array(value).fill(0).map((_, idx) => idx);
    }
    return value != null ? value.toString().split('') : [];
  }
}
