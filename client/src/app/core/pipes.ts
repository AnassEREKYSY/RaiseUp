import { Pipe, PipeTransform } from '@angular/core';
import { initials, label, money, timeAgo } from './labels';

@Pipe({ name: 'label' }) export class LabelPipe implements PipeTransform { transform(v: string | null | undefined) { return label(v); } }
@Pipe({ name: 'money' }) export class MoneyPipe implements PipeTransform { transform(v: number | null | undefined, empty = '–') { return money(v, empty); } }
@Pipe({ name: 'initials' }) export class InitialsPipe implements PipeTransform { transform(v: string | null | undefined) { return initials(v); } }
@Pipe({ name: 'ago', pure: false }) export class AgoPipe implements PipeTransform { transform(v: string) { return timeAgo(v); } }
