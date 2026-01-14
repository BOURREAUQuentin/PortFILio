export interface Project {
  id: number;
  name: string;
  description: string;
  technologies: string[];
  modules: string[];
  promotion: string;
  collaborators: number[];
}
