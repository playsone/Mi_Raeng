import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Welcome} from './pages/welcome/welcome';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Home} from './pages/home/home';
import { Exercise } from './pages/exercise/exercise';
import { Ranking } from './pages/ranking/ranking';
import { MyTree } from './pages/my-tree/my-tree';
import { Quiz } from './pages/quiz/quiz';
import { Profile } from './pages/profile/profile';
import { Dance } from './pages/dance/dance';
import { AdminComponent } from './pages/admin/admin';
import { MemberDetailComponent } from './pages/member-detail/member-detail';
import { AdminProfile } from './pages/admin-profile/admin-profile';

export const routes: Routes = [
  { path: '', redirectTo: '/quiz', pathMatch: 'full' },
  { path: 'welcome', component: Welcome },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'home', component: Home },
  { path: 'exercise', component: Exercise }, 
  { path: 'ranking', component: Ranking } ,
  { path: 'mytree', component: MyTree },
  { path: 'quiz', component: Quiz },
  { path: 'profile', component: Profile },
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  { path: 'dance', component: Dance },
  {path: 'admin', component: AdminComponent}, // เพิ่มเส้นทางสำหรับหน้าแอดมิน
  {path: 'member-detail/:uid', component: MemberDetailComponent} ,// เพิ่มเส้นทางสำหรับหน้าแอดมิน
  {path: 'admin-profile', component: AdminProfile} // เพิ่มเส้นทางสำหรับหน้าแอดมิน
  

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
