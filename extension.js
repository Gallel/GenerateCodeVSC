// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const axios = require('axios');
const xml2js = require('xml2js');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const outputChannel = vscode.window.createOutputChannel('Test Results');

    context.subscriptions.push(vscode.commands.registerCommand('extension.generateCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const selection = editor.selection;
            const text = document.getText(selection);

            try {
                const response = await axios.post('http://15.236.1.141:5000/generate_code', {
                    user_text: text
                });

                if (response.data.error) {
                    vscode.window.showErrorMessage(`Error al ejecutar el script: ${response.data.error}`);
                } else {
                    const wrappedOutput = `<root>${response.data.output}</root>`;
                    const parser = new xml2js.Parser();
                    parser.parseString(wrappedOutput, function(err, result) {
                        if (err) {
                            vscode.window.showErrorMessage(`Error al analizar el XML: ${err.toString()}`);
                            outputChannel.clear();
                            outputChannel.appendLine(`XML:\n${wrappedOutput}`);
                            outputChannel.show();
                        } else {
                            const code = result.root.code[0].$.value;
                            editor.edit(editBuilder => {
                                editBuilder.insert(selection.end, '\n' + code);
                            });

                            const tests = result.root.tests[0].test;
                            outputChannel.clear();
                            tests.forEach(test => {
                                const testResult = test.$.result;
                                const testCase = test.$.case;
                                const testReason = test.$.reason;
                                outputChannel.appendLine(`Resultado: ${testResult} -> Caso testeado: ${testCase} -> Motivo del fallo: ${testReason}`);
                            });
                            outputChannel.show();
                        }
                    });
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Error al hacer la solicitud: ${error.toString()}`);
            }
        }
    }));
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
