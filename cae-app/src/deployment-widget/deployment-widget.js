import {LitElement, html} from "lit-element";
import Common from "../util/common";
import Static from "../static";

export class DeploymentWidget extends LitElement {
  render() {
    return html`
      <style>
        paper-button {
          height: 2.5em;
        }
        .paper-button-blue {
          color: rgb(240,248,255);
          background: rgb(30,144,255);
          height: 2.5em;
        }
        .paper-button-blue:hover {
          color: rgb(240,248,255);
          background: rgb(65,105,225);
        }
        paper-button[disabled] {
          background: #e1e1e1;
        }
      </style>
      
      <paper-button id="deploy-model" @click=${this._onDeployButtonClicked} class="paper-button-blue">Deploy</paper-button>
      
      <div class="form-group">
      <input type="text" class="form-control" id="status" placeholder="Status..">
      <br>
      <textarea id="deploy-status" class="form-control" readonly></textarea>
    </div>
    `;
  }

  static get properties() {
    return {
      pendingDots: {
        type: Number
      }
    }
  }

  constructor() {
    super();
    this.pendingDots = 0;
  }

  _onDeployButtonClicked() {
    this.getDeployButton().setAttribute("disabled", "true");
    this.deployRequest("Build");
  }

  deployRequest(jobAlias) {
    fetch(Static.ModelPersistenceServiceURL + "/deploy/" + Common.getVersionedModelId() + "/" + jobAlias, {
      method: "GET"
    }).then(response => {
      return response.text()
    }).then(data => {
      if(data.indexOf("Error") > -1){
        console.error(data);
      }else{
        this.getStatusInput().value = "Starting deployment";
        console.log("Deployment: Starting deployment");
        console.log("Deployment: Start polling job console text");
        this.pollJobConsoleText(data, jobAlias);
      }
    });
  }

  pollJobConsoleText(location, jobAlias) {
    this.getDeployStatusTextarea().removeAttribute("hidden");
    setTimeout(function() {
      var feedbackString = "Deployment in progess" + Array(this.pendingDots+1).join(".");
      this.getStatusInput().value = feedbackString;
      console.log(feedbackString);
      this.getJobConsoleText(location, jobAlias);
    }.bind(this),1000);
  }

  getJobConsoleText(queueItem, jobAlias){
    fetch(Static.ModelPersistenceServiceURL + "/deployStatus?queueItem=" + queueItem + "&jobAlias=" + jobAlias, {
      method: "GET"
    }).then(response => {
      return response.text();
    }).then(data => {
      if(data.indexOf("Pending") > -1){
        data = jobAlias + " job pending" + Array(this.pendingDots+1).join(".");
      }

      this.pendingDots = (this.pendingDots + 1) % 4;

      this.getDeployStatusTextarea().value = data;

      //$("#deploy-status").text(data);
      //$('#deploy-status').scrollTop($('#deploy-status')[0].scrollHeight);
      if(data.indexOf("Finished: SUCCESS") > -1){
        switch(jobAlias){
          case "Build":
            this.getStatusInput().value = "Building was successfully!";
            this.deployRequest("Docker");
            break;
          case "Docker":
            //$("#deploy-model").prop('disabled',true);
            this.getStatusInput().value = "Application is now ready!";
            console.log("Deployment: Application is now ready!");
            //$("#deploy-status").hide();
            break;
        }
      }else if(data.indexOf("Finished: FAILURE") > - 1){
        console.log("Deployment: Error during deployment!");
      }
      else{
        this.pollJobConsoleText(queueItem,jobAlias);
      }
    });
  }

  getDeployButton() {
    return this.shadowRoot.getElementById("deploy-model");
  }

  getDeployStatusTextarea() {
    return this.shadowRoot.getElementById("deploy-status");
  }

  getStatusInput() {
    return this.shadowRoot.getElementById("status");
  }
}

customElements.define('deployment-widget', DeploymentWidget);
