import { User, UserRole, Grade, ScoreUpdate } from '../types';

const USERS_KEY = 'linguoquest_users';
const SCORES_KEY = 'linguoquest_scores';

export const db = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    // Returning empty array for fresh start as requested
    return data ? JSON.parse(data) : [];
  },

  saveUser: (user: User) => {
    const users = db.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index > -1) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getScores: (): ScoreUpdate[] => {
    const data = localStorage.getItem(SCORES_KEY);
    return data ? JSON.parse(data) : [];
  },

  addScore: (score: ScoreUpdate) => {
    const scores = db.getScores();
    scores.push(score);
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
    
    // Update user total points
    const users = db.getUsers();
    const user = users.find(u => u.id === score.userId);
    if (user) {
      user.points += score.pointsEarned;
      db.saveUser(user);
    }
  }
};