# Project Dependencies Overview

## Backend (RD/backend/package.json)

- Dependencies:
  - @google/generative-ai: ^0.2.1
  - @tensorflow/tfjs: ^4.22.0
  - @tensorflow/tfjs-backend-cpu: ^4.22.0
  - bcryptjs: ^3.0.2
  - cors: ^2.8.5
  - dotenv: ^16.0.3
  - express: ^4.18.2
  - express-rate-limit: ^6.7.0
  - express-validator: ^6.15.0
  - firebase: ^12.1.0
  - firebase-admin: ^13.4.0
  - helmet: ^6.1.5
  - multer: ^1.4.5-lts.1
  - node-cron: ^3.0.2
  - pdf-lib: ^1.17.1
  - sharp: ^0.32.1
  - winston: ^3.10.0
- DevDependencies:
  - jest: ^29.5.0
  - nodemon: ^3.1.10
  - supertest: ^6.3.3
- Engines:
  - node: >=16.0.0

## Frontend (RD/frontend/package.json)

- Dependencies:
  - @fortawesome/fontawesome-svg-core: ^6.4.0
  - @fortawesome/free-solid-svg-icons: ^6.4.0
  - @fortawesome/react-fontawesome: ^0.2.0
  - @testing-library/jest-dom: ^5.16.4
  - @testing-library/react: ^13.3.0
  - @testing-library/user-event: ^13.5.0
  - axios: ^1.3.4
  - chart.js: ^4.2.1
  - date-fns: ^2.30.0
  - firebase: ^12.1.0
  - html2canvas: ^1.4.1
  - jspdf: ^3.0.1
  - react: ^18.2.0
  - react-beautiful-dnd: ^13.1.1
  - react-chartjs-2: ^5.2.0
  - react-datepicker: ^4.16.0
  - react-dom: ^18.2.0
  - react-dropzone: ^14.2.3
  - react-modal: ^3.16.1
  - react-router-dom: ^6.8.1
  - react-scripts: ^5.0.1
  - react-select: ^5.7.4
  - react-toastify: ^9.1.1
  - recharts: ^2.5.0
  - styled-components: ^5.3.9
- DevDependencies:
  - @types/styled-components: ^5.1.26

## Cross-package version alignment

- Shared packages across frontend and backend:
  - firebase: ^12.1.0 (frontend) vs ^12.1.0 (backend) → OK (matched)
- No other shared packages detected.

## Notes / Potential Issues

- Backend code uses tf.node.decodeImage, which requires @tensorflow/tfjs-node. Current backend dependencies include @tensorflow/tfjs and @tensorflow/tfjs-backend-cpu, but not @tensorflow/tfjs-node. If you plan to run real predictions, add @tensorflow/tfjs-node at version ^4.22.0 and enable the Node backend.
