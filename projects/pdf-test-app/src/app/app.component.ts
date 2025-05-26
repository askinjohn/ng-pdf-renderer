import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="app-container">
      <nav class="navigation">
        <h1>🔬 ng-pdf-renderer Test Suite</h1>
        <div class="nav-buttons">
          <button 
            [class.active]="isActiveRoute('/simple')"
            (click)="navigate('/simple')"
            class="nav-btn">
            Simple Test
          </button>
          <button 
            [class.active]="isActiveRoute('/npm')"
            (click)="navigate('/npm')"
            class="nav-btn">
            NPM Package Test
          </button>
          <button 
            [class.active]="isActiveRoute('/clean')"
            (click)="navigate('/clean')"
            class="nav-btn">
            Clean Test
          </button>
        </div>
        <p class="description">Choose a test to see ng-pdf-renderer in action with default settings</p>
      </nav>
      
      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .navigation {
      background: white;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    
    .navigation h1 {
      color: #2c3e50;
      margin-bottom: 15px;
    }
    
    .nav-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-bottom: 10px;
    }
    
    .nav-btn {
      padding: 12px 24px;
      border: 2px solid #3498db;
      background: white;
      color: #3498db;
      border-radius: 25px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .nav-btn:hover {
      background: #3498db;
      color: white;
      transform: translateY(-2px);
    }
    
    .nav-btn.active {
      background: #2980b9;
      color: white;
      border-color: #2980b9;
    }
    
    .description {
      color: #666;
      margin: 0;
      font-style: italic;
    }
    
    .content {
      padding: 0;
    }
    
    @media (max-width: 768px) {
      .nav-buttons {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class AppComponent {
  constructor(private router: Router) {}
  
  navigate(route: string) {
    this.router.navigate([route]);
  }
  
  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }
}
