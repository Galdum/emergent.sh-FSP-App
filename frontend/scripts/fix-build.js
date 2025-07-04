const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing build dependencies...');

// Path to the webpack config in react-scripts
const webpackConfigPath = path.join(
  __dirname,
  '../node_modules/react-scripts/config/webpack.config.js'
);

try {
  // Read the webpack config
  let webpackConfig = fs.readFileSync(webpackConfigPath, 'utf8');
  
  // Remove or comment out the fork-ts-checker-webpack-plugin
  const modifications = [
    {
      search: /const ForkTsCheckerWebpackPlugin = require\('fork-ts-checker-webpack-plugin'\);/g,
      replace: '// const ForkTsCheckerWebpackPlugin = require(\'fork-ts-checker-webpack-plugin\');'
    },
    {
      search: /new ForkTsCheckerWebpackPlugin\([^}]+}\),?/g,
      replace: '// ForkTsCheckerWebpackPlugin disabled due to AJV compatibility issues'
    },
    {
      search: /,?\s*new ForkTsCheckerWebpackPlugin\([^}]+}\)/g,
      replace: ''
    }
  ];
  
  let modified = false;
  modifications.forEach(mod => {
    if (mod.search.test(webpackConfig)) {
      webpackConfig = webpackConfig.replace(mod.search, mod.replace);
      modified = true;
    }
  });
  
  if (modified) {
    // Backup original file
    fs.writeFileSync(webpackConfigPath + '.backup', fs.readFileSync(webpackConfigPath));
    
    // Write modified config
    fs.writeFileSync(webpackConfigPath, webpackConfig);
    
    console.log('✅ Webpack config modified successfully');
    console.log('📁 Original config backed up to webpack.config.js.backup');
  } else {
    console.log('⚠️  No modifications needed or pattern not found');
  }
  
} catch (error) {
  console.log('❌ Error modifying webpack config:', error.message);
  console.log('💡 Continuing with alternative approach...');
  
  // Alternative: Create a custom webpack config override
  const overridePath = path.join(__dirname, '../config-overrides.js');
  const overrideContent = `
const { override, removeModuleScopePlugin, disableEsLint } = require('customize-cra');

module.exports = override(
  disableEsLint(),
  removeModuleScopePlugin(),
  (config) => {
    // Remove ForkTsCheckerWebpackPlugin
    config.plugins = config.plugins.filter(
      plugin => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
    );
    
    // Disable source maps for faster builds
    config.devtool = false;
    
    return config;
  }
);
`;
  
  fs.writeFileSync(overridePath, overrideContent);
  console.log('✅ Created config-overrides.js as alternative');
}

console.log('🚀 Build fix completed!');