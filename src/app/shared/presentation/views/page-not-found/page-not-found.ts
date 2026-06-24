import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import {MatIcon} from '@angular/material/icon';

/**
 * Displays fallback content for unknown routes.
 */
@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [MatButton, TranslatePipe, MatIcon],
  templateUrl: './page-not-found.html',
  styleUrl: './page-not-found.css',
})
export class PageNotFound implements OnInit {
  /**
   * The invalid path that led to this page.
   */
  protected invalidPath = '';

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.invalidPath = this.route.snapshot.url.map((segment) => segment.path).join('/');
  }

  protected navigateToHome(): void {
    this.router.navigate(['home']).then();
  }
}
