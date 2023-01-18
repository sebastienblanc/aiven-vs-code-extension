import * as vscode from 'vscode';
import * as https from 'https';

export class AivenServiceTreeview implements vscode.TreeDataProvider<Service> {
  private _onDidChangeTreeData: vscode.EventEmitter<Service | undefined | void> = new vscode.EventEmitter<Service | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Service | undefined | void> = this._onDidChangeTreeData.event;
  constructor(private context: vscode.ExtensionContext) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Service): vscode.TreeItem {

    return element;
  }

  getChildren(element?: Service): Thenable<Service[]> {
    if (!element) {
      return this.getServices();
    }
    return Promise.resolve([]);
  }


 

  public openView(service: Service): void {
    const panel = vscode.window.createWebviewPanel(
      'serviceDetail',
      `${service.label} Detail`,
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html= this.getWebviewContent(service, panel.webview);

    // TODO: Call Aiven API to retrieve service detail and display it in the webview panel
  }

  private getWebviewContent(service: Service, webview: vscode.Webview) {

    return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Service Details</title>
  </head>
  <body>
      <h1>Service Details</h1>
      <h2>${service.label}</h2>
      <br>
      <p>Host : ${service.connectionDetails.host}</p>
      <p>User : ${service.connectionDetails.user}</p>
      <p>Password : <input type="password" value="${service.connectionDetails.password}">

  </body>
  </html>`;
  }

  
  

  private getServices(): Thenable<Service[]> {
    const options = {
      hostname: 'api.aiven.io',
      path: `/v1/project/${vscode.workspace.getConfiguration().get('aiven.project')}/service`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vscode.workspace.getConfiguration().get('aiven.accessToken')}`
      }
    };

    return new Promise((resolve, reject) => {
      https.get(options, (res) => {
        res.setEncoding('utf8');
        let body = '';
        res.on('data', (data) => {
          body += data;
        });
        res.on('end', () => {
          const services: Service[] = [];
          const data = JSON.parse(body);
          for (const service of data['services']) {
            
            services.push(new Service(service['service_name'], service['service_uri_params'], vscode.TreeItemCollapsibleState.Collapsed));
            
          }
          resolve(services);
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }
}

class Service extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public connectionDetails: any,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.description = this.connectionDetails;
  }

}
