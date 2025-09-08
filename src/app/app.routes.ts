import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Welcome} from './pages/welcome/welcome';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Home} from './pages/home/home';
import { Exercise } from './pages/exercise/exercise';
import { Ranking } from './pages/ranking/ranking';

export const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'welcome', component: Welcome },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'home', component: Home },
  { path: 'exercise', component: Exercise },
  { path: 'ranking', component: Ranking }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }