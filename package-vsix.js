'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = __dirname;
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const staging = path.join(root, '.vsix-staging');
const extension = path.join(staging, 'extension');
fs.rmSync(staging, { recursive: true, force: true });
fs.mkdirSync(extension, { recursive: true });
for (const item of ['package.json', 'README.md', 'CHANGELOG.md', 'icon.png']) fs.copyFileSync(path.join(root, item), path.join(extension, item));
fs.copyFileSync(path.join(root, 'LICENSE'), path.join(extension, 'LICENSE.txt'));
fs.cpSync(path.join(root, 'dist'), path.join(extension, 'dist'), { recursive: true });
fs.writeFileSync(path.join(staging, '[Content_Types].xml'), `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension=".js" ContentType="application/javascript" />
  <Default Extension=".json" ContentType="application/json" />
  <Default Extension=".md" ContentType="text/markdown" />
  <Default Extension=".png" ContentType="image/png" />
  <Default Extension=".svg" ContentType="image/svg+xml" />
  <Default Extension=".txt" ContentType="text/plain" />
  <Default Extension=".vsixmanifest" ContentType="text/xml" />
</Types>
`);
fs.writeFileSync(path.join(staging, 'extension.vsixmanifest'), `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">
  <Metadata>
    <Identity Language="en-US" Id="cline-rtl-smart-support-plus" Version="${packageJson.version}" Publisher="${packageJson.publisher}" />
    <DisplayName>Cline RTL Smart Support Plus</DisplayName>
    <Description xml:space="preserve">Smart right-to-left language support for Cline and Roo Cline chat webviews.</Description>
    <Tags>cline,roo-cline,rtl,persian,farsi,arabic,hebrew,bidi</Tags>
    <Categories>Other,Chat</Categories>
    <GalleryFlags>Public</GalleryFlags>
    <Properties>
      <Property Id="Microsoft.VisualStudio.Code.Engine" Value="^1.84.0" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="workspace" />
      <Property Id="Microsoft.VisualStudio.Services.GitHubFlavoredMarkdown" Value="true" />
      <Property Id="Microsoft.VisualStudio.Services.Links.Source" Value="https://github.com/wolf1999h/RTL-cline" />
      <Property Id="Microsoft.VisualStudio.Services.Links.Getstarted" Value="https://github.com/wolf1999h/RTL-cline" />
      <Property Id="Microsoft.VisualStudio.Services.Links.GitHub" Value="https://github.com/wolf1999h/RTL-cline" />
      <Property Id="Microsoft.VisualStudio.Services.Links.Support" Value="https://github.com/wolf1999h/RTL-cline/issues" />
      <Property Id="Microsoft.VisualStudio.Services.Links.Learn" Value="https://github.com/wolf1999h/RTL-cline#readme" />
    </Properties>
    <License>extension/LICENSE.txt</License>
    <Icon>extension/icon.png</Icon>
  </Metadata>
  <Installation><InstallationTarget Id="Microsoft.VisualStudio.Code" /></Installation>
  <Dependencies />
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />
    <Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true" />
    <Asset Type="Microsoft.VisualStudio.Services.Content.Changelog" Path="extension/CHANGELOG.md" Addressable="true" />
    <Asset Type="Microsoft.VisualStudio.Services.Content.License" Path="extension/LICENSE.txt" Addressable="true" />
    <Asset Type="Microsoft.VisualStudio.Services.Icons.Default" Path="extension/icon.png" Addressable="true" />
  </Assets>
</PackageManifest>
`);
const output = path.join(root, `cline-rtl-smart-support-plus-${packageJson.version}.vsix`);
fs.rmSync(output, { force: true });
const result = spawnSync('zip', ['-X', '-q', '-r', output, '.'], { cwd: staging, stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);
fs.rmSync(staging, { recursive: true, force: true });
console.log(`Packaged ${output}`);
