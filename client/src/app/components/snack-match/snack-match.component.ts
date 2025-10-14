import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

export type SnackMatchData = { message: string; action?: string };

@Component({
  selector: 'app-snack-match',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './snack-match.component.html',
  styleUrls: ['./snack-match.component.scss']
})
export class SnackMatchComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: SnackMatchData,
    private ref: MatSnackBarRef<SnackMatchComponent>
  ) {}
  act() { this.ref.dismissWithAction(); }
}
