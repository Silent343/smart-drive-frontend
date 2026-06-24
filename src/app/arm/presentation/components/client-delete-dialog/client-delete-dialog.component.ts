import {Component, inject} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {CommonModule} from '@angular/common';
import {Client} from '../../../domain/model/client.entity';

@Component({
  selector: 'app-client-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, TranslateModule],
  templateUrl: './client-delete-dialog.component.html',
  styleUrl: './client-delete-dialog.component.css',
})
export class ClientDeleteDialogComponent {
  private dialogRef = inject(MatDialogRef<ClientDeleteDialogComponent>);

  // Inyectamos el objeto Client que el padre envió para el mensaje de confirmación
  protected data = inject<Client>(MAT_DIALOG_DATA);
}
