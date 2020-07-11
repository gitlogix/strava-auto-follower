const path = require('path');
const webpack = require('webpack');
const ZipPlugin = require('zip-webpack-plugin');
const RemovePlugin = require('remove-files-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
	mode: "development",
	entry: {
		background: './background.js',
		content: './content.js'
	},
	output: {
		chunkFilename: '[name].js',
		path: path.join(__dirname, 'build'),
		publicPath: '/'
	},

	resolve: {
		extensions: ['.js', '.jsx', '.scss', '.json'],
		modules: ['node_modules']
	},

	module: {
		rules: [
			{
				test: /\.(jsx|js)?$/,
				loader: 'babel-loader',
				exclude: /(node_modules)/,
				include: path.join(__dirname, 'src'),
				query: {
					presets: ['es2015', 'react']
				}
			}
		]
	},
	plugins: [
		new RemovePlugin({
			before: {
				include: [
					'./build',
					'./build.zip'
				]
			}
		}),
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: JSON.stringify('development')
			},
		}),
		new CopyPlugin({
			patterns: [
			  {from: 'images', to: 'images'},
			  {from: 'manifest.json', to: 'manifest.json'}
			],
		}),
		new ZipPlugin({
			path: '../',
			filename: 'build.zip',
			include: [/\.js$/, /\.html$/, /\.png$/, /\.svg$/, /\.jpeg$/, /\.jpg$/, /\.gif$/],
			fileOptions: {
			  mtime: new Date(),
			  mode: 0o100664,
			  compress: true,
			  forceZip64Format: false,
			},
			zipOptions: {
			  forceZip64Format: false,
			},
		})
	]
};
