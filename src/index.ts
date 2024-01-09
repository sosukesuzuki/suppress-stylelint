#!/usr/bin/env node

import fs from "node:fs/promises";
import stylelint from "stylelint";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
async function addStylelintComments(filePath: string, warnings: any[]) {
	try {
		let fileContent = await fs.readFile(filePath, "utf8");
		const lines = fileContent.split("\n");

		for (let i = warnings.length - 1; i >= 0; i--) {
			const warning = warnings[i];
			const comment = `/* stylelint-disable-next-line ${warning.rule} */`;
			const lineIndex = warning.line - 1;
			lines.splice(lineIndex, 0, comment);
		}

		fileContent = lines.join("\n");
		await fs.writeFile(filePath, fileContent);
	} catch (error) {
		// @ts-ignore
		console.error(`Error occurred: ${error.message}`);
	}
}

async function run(pattern: string) {
	const { output } = await stylelint.lint({
		files: pattern,
		globbyOptions: {
			expandDirectories: {
				extensions: ["css", "scss"],
			},
		},
	});
	const outputs = JSON.parse(output);
	await Promise.all(
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		outputs.map(async (output: any) => {
			if (output.warnings.length === 0) {
				return;
			}
			await addStylelintComments(output.source, output.warnings);
		}),
	);
	const fileCount = outputs.length;
	const files = fileCount === 1 ? "file" : "files";
	console.log(`stylelint-disable-next-line added to ${fileCount} ${files}`);
}

const [pattern] = process.argv.slice(2);
run(pattern).catch((error) => {
	console.error(error);
	process.exit(1);
});
