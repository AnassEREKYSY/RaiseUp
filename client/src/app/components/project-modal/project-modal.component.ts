import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Industry } from '../../core/enums/industry.enum';
import { ProjectsService } from '../../services/projects.service';

@Component({
  selector: 'app-project-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './project-modal.component.html',
  styleUrls: ['./project-modal.component.scss']
})
export class ProjectModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  form: FormGroup;
  industries = Object.values(Industry);

  constructor(private fb: FormBuilder, private projectService: ProjectsService) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      fundingGoal: [null],
      industry: ['', Validators.required]
    });
  }

  submit() {
    if (this.form.invalid) return;
    const data = this.form.value;
    this.projectService.createProject(data).subscribe({
      next: () => {
        this.created.emit();
        this.close.emit();
      },
      error: (err) => console.error(err)
    });
  }

  closeModal() {
    this.close.emit();
  }
}
