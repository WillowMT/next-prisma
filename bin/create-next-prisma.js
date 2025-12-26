#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectName = process.argv[2];

if (!projectName) {
    console.error('Please provide a project name:');
    console.error('  npx @waiyanmt/next-prisma my-app');
    console.error('  create-next-prisma my-app');
    process.exit(1);
}

const targetDir = path.resolve(projectName);

if (fs.existsSync(targetDir)) {
    console.error(`Directory "${projectName}" already exists.`);
    process.exit(1);
}

console.log(`Creating Next.js + Prisma app in ${targetDir}...`);

try {
    // Create target directory
    fs.mkdirSync(targetDir, { recursive: true });

    // Copy template files
    const templateDir = path.resolve(__dirname, '..');

    function copyTemplate(src, dest) {
        const stat = fs.statSync(src);

        if (stat.isDirectory()) {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }

            const files = fs.readdirSync(src);
            files.forEach(file => {
                const srcPath = path.join(src, file);
                const destPath = path.join(dest, file);

                // Skip node_modules, .git, and bin directory
                if (file !== 'node_modules' && file !== '.git' && file !== 'bin') {
                    copyTemplate(srcPath, destPath);
                }
            });
        } else {
            fs.copyFileSync(src, dest);
        }
    }

    copyTemplate(templateDir, targetDir);

    // Remove bin directory from the copied template
    const binDir = path.join(targetDir, 'bin');
    if (fs.existsSync(binDir)) {
        fs.rmSync(binDir, { recursive: true, force: true });
    }

    // Update package.json with project name
    const packageJsonPath = path.join(targetDir, 'package.json');
    let packageJson = fs.readFileSync(packageJsonPath, 'utf8');
    packageJson = packageJson.replace('{{project-name}}', projectName);
    fs.writeFileSync(packageJsonPath, packageJson);

    // Change to the project directory and install dependencies
    process.chdir(targetDir);

    console.log('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    console.log('Setting up Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    console.log('\n✅ Success! Created Next.js + Prisma app at:', targetDir);
    console.log('\nNext steps:');
    console.log(`  cd ${projectName}`);
    console.log('  # Set up your database URL in .env');
    console.log('  npx prisma migrate dev --name init');
    console.log('  npm run dev');
    console.log('\n📚 Documentation:');
    console.log('  - Next.js: https://nextjs.org/docs');
    console.log('  - Prisma: https://www.prisma.io/docs');

} catch (error) {
    console.error('Error creating project:', error.message);
    process.exit(1);
}
