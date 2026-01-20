# 🚀 PortFIL'io

**PortFIL'io** est une application web communautaire destinée aux étudiants de l'école d'ingénieurs **FIL**. Elle permet aux étudiants de publier leurs projets, de découvrir ceux des autres promotions, de collaborer et de se constituer un portfolio professionnel.

![Angular](https://img.shields.io/badge/Angular-17+-DD0031?style=for-the-badge&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)
![SCSS](https://img.shields.io/badge/Sass-CC6699?style=for-the-badge&logo=sass)

---

## 📑 Table des matières
1. [Fonctionnalités Clés](#-fonctionnalités-clés)
2. [Architecture Technique](#-architecture-technique)
3. [Installation et Lancement](#-installation-et-lancement)
4. [Partage sur Réseau Local (Eduroam)](#-partage-sur-réseau-local)
5. [Documentation et Maquettes](#-documentation-et-maquettes)

---

## ✨ Fonctionnalités Clés

### 🏠 Accueil & Découverte
- **Accueil du site :** Présentation visuelle des projets phares.
- **Recherche Avancée :** Barre de recherche textuelle combinée à des filtres par **Tags**, **Modules** et **Promotions**.
- **Système de Tri :** Tri par date (récent/ancien) ou ordre alphabétique.
- **Pagination Dynamique :** Gestion fluide de l'affichage des projets.
- **Persistance d'État :** Grâce au `ProjectService`, la page, les filtres et la recherche sont sauvegardés lors de la navigation (si on clique sur un projet et qu'on revient, on ne perd pas sa place).

### 🖼️ Détail Projet & Immersion
- **Galerie Lightbox :** Visualisation des images en plein écran avec navigation (clavier/souris) et compteur.
- **Informations Détaillées :** Accordéons pour afficher l'origine du projet, les compétences acquises et les liens externes.
- **Actions Auteurs :** Édition et suppression (sécurisées pour l'auteur uniquement).

### ❤️ Gestion des Favoris
- **Like/Unlike :** Ajout de projets aux favoris personnels.
- **Page Dédiée :** Retrouvez tous vos coups de cœur avec les mêmes outils de filtrage, de tri et de recherche que la page d'accueil (état indépendant).

### 👤 Profil & Auth
- **Authentification :** Simulation Login/Register avec stockage sécurisé dans le `localStorage`.
- **Édition de Profil :** Modification des infos personnelles, avatar, et liens réseaux sociaux.

### 📱 Ergonomie
- **Scroll-to-Top :** Bouton flottant pour remonter rapidement en haut de page.
- **Responsive Design :** Interface adaptée aux mobiles, tablettes et desktops.

---

## 🛠️ Architecture Technique

Le projet suit une architecture modulaire stricte :

- **`Core`** : Services singletons (`AuthService`, `ProjectService`, `ToastService`) et Modèles (`User`, `Project`).
- **`Shared`** : Composants réutilisables (`Header`, `Footer`, `ProjectCard`, `SearchBar`, `Avatar`, `ConfirmModal`, `ScrollToTop`).
- **`Pages`** : Vues principales (`Home`, `ProjectDetail`, `Favorites`, `Profile`, `Auth`).

**Points forts du code :**
- Utilisation des **Standalone Components** d'Angular.
- Gestion des flux de données réactifs avec **RxJS** (`combineLatest`, `BehaviorSubject`).
- Style modulaire avec **SCSS** et variables globales.

---

## 💻 Installation et Lancement

1. **Cloner le projet :**
   ```bash
   git clone https://github.com/BOURREAUQuentin/PortFILio.git
   cd portfilio
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Lancer l'application :**
   ```bash
   ng serve
    ```
   
Accédez à l'application via *http://localhost:4200*.

---

## 🌐 Partage sur Réseau Local

Cette section explique comment montrer le projet à des collègues sur le même réseau Wi-Fi (ex: Eduroam).

### Méthode : Standard (Si le réseau le permet)

Cette méthode fonctionne sur les réseaux domestiques ou les partages de connexion.

1. **Lancer le serveur Angular avec l'option `--host` :**
   ```bash
   ng serve --host
    ```
   
2. **Trouver votre adresse IP locale :**
   - Sur Windows : `ipconfig` dans l'invite de commande.
   - Sur macOS/Linux : `ifconfig` dans le terminal.
   - Cherchez l'adresse IPv4 (ex: `192.168.x.x`).

3. **Partager l'adresse :**
   Donnez à vos collègues l'adresse suivante : `http://<votre-ip-locale>:4200`.

4. **Accès :**
   Ils peuvent accéder à l'application via cette adresse dans leur navigateur.

---

## 📚 Documentation et Maquettes
- **Maquettes Figma :** [lien](https://www.figma.com/design/denqxaVm4UcQY389QttAWh/PortFILio?node-id=65-253&p=f&t=lryJqrK3Pkkq7O6I-0)
- **Diagrammes de cas d'utilisation UML :** [lien](https://drive.google.com/file/d/1VSIlsXBcukc28c2IV0Q9NxAxgjN3v46a/view)
- **Miro de brainstorming :** [lien](https://miro.com/app/board/uXjVJkzns0M=/)
- **Diaporama détaillé du Projet :** [lien](https://www.canva.com/design/DAG-9HvoTNk/mZa07DH8VxWiQMuISsen1A/edit?ui=eyJBIjp7fX0)
- **Diaporama de la présentation du mercredi du Projet :** [lien](https://docs.google.com/presentation/d/1aEKwyYCdCqAbAl0IwrW0l27smPXfHhgLLfLZZH1g8vk/edit?slide=id.g623c2e0530_1_333#slide=id.g623c2e0530_1_333)
- **Questionnaire PortFILio :** [lien](https://docs.google.com/forms/d/e/1FAIpQLSegwFzD2XqyiqpT3uggg0-pZK4EKXVh7l_b71gP_ZLWCY_FKA/viewform?usp=dialog)
- **Questionnaire SUS :** [lien](https://docs.google.com/forms/d/e/1FAIpQLSeshx4oCbEfQeeUOCpNF8rrIT_lX5X5VvFaLrUY1ZVmSBHk-Q/viewform?usp=dialog)

---

Merci d'avoir exploré **PortFIL'io** ! N'hésitez pas à contribuer ou à poser des questions. 🚀

Développé avec ❤️ par Quentin Bourreau, Aloïs Fleury et Jules Autret.
