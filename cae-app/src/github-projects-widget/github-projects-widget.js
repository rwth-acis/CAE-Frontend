import {LitElement, html} from "lit-element";
import Common from "../util/common";
import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-tabs/paper-tab.js';
import GitHubHelper from "../util/github-helper";
import Auth from "../util/auth";

/**
 * Widget used to display the columns and their cards of a GitHub project.
 * Also supports the creation of new cards.
 */
export class GitHubProjectsWidget extends LitElement {
  render() {
    return html`
      <style>
        a {
          text-decoration: none;
          color: rgb(30,144,255)
        }
        a:hover {
          color: rgb(65,105,225);
        }
        paper-tabs {
          --paper-tabs-selection-bar-color: rgb(30,144,255);
        }
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
      </style>
      
      <div id="main" style="margin-left: 0.5em; margin-right: 0.5em">
        <h3 style="margin-top: 0.5em; margin-bottom: 0.5em">GitHub Projects - 
          <a href=${this.gitHubProjectHtmlUrl} target="_blank">${this.projectName}</a>
        </h3>
        ${this.accessToken ? html`` : html`
          <div>Go to Settings and connect with your GitHub account to view the GitHub project.</div>
        `}
        <div style="overflow-y: auto">
          ${this.columns ? html`
            <paper-tabs id="column-tabs" selected="0">
              ${this.columns.map(column => html`
                <paper-tab @click=${(e) => this.displayCards(column)}>${column.name}</paper-tab>
              `)}
            </paper-tabs>
          ` : html``}
        </div>
        <div id="cards-content">
         
        </div>
        ${this.accessToken ? html`
          <div>
            <custom-style>
              <style is="custom-style">
                .custom-parent {
                  font-size: 12px;
                }
                paper-input.custom:hover {
                  border: 1px solid rgb(30,144,255);
                }
                paper-input.custom {
                  margin-bottom: 14px;
                  --primary-text-color: #01579B;
                  --paper-input-container-color: black;
                  --paper-input-container-focus-color: black;
                  --paper-input-container-invalid-color: black;
                  border: 1px solid #BDBDBD;
                  border-radius: 5px;

                  /* Reset some defaults */
                  --paper-input-container: { padding: 0;};
                  --paper-input-container-underline: { display: none; height: 0;};
                  --paper-input-container-underline-focus: { display: none; };

                  /* New custom styles */
                  --paper-input-container-input: {
                    box-sizing: border-box;
                    font-size: inherit;
                    padding: 4px;
                  };
                  --paper-input-container-label: {
                    top: -8px;
                    left: 4px;
                    background: white;
                    padding: 2px;
                    font-weight: bold;
                  };
                  --paper-input-container-label-floating: {
                    width: auto;
                  };
                }
              </style>
            </custom-style>
            <paper-input id="input-note" class="custom" label="Note" style="margin-top: 1em; margin-bottom: 0.5em" always-float-label></paper-input>
            <div style="display: flex">
              <paper-button class="paper-button-blue" style="margin-left: auto"
                @click=${this._onAddCardClicked}>Add Card</paper-button>
            </div>
          </div>
        ` : html``}
      </div>
    `;
  }

  static get properties() {
    return {
      gitHubProjectId: { type: Number },
      gitHubProjectHtmlUrl: { type: String },
      projectName: { type: String },
      accessToken: { type: String },
      columns: { type: Array },
      columnCards: { type: Object },
      selectedColumn: { type: Object }
    }
  }

  constructor() {
    super();

    // load id of GitHub project required for API requests
    const componentType = Common.getComponentTypeByVersionedModelId(Common.getVersionedModelId());
    const modelingInfo = Common.getModelingInfo()[componentType];
    this.gitHubProjectId = modelingInfo.gitHubProjectId;
    // get information used to display project name and to link to GitHub
    this.gitHubProjectHtmlUrl = modelingInfo.gitHubProjectHtmlUrl;
    this.projectName = modelingInfo.projectName;

    // get users access token
    GitHubHelper.getGitHubAccessToken(Auth.getAccessToken()).then(accessToken => {
      this.accessToken = accessToken;

      // load cards (and reload them every 10 seconds)
      this.loadCards();
      this.interval = setInterval(this.loadCards.bind(this), 10000);
    }, error => {

    });

    this.columnCards = {};
  }

  clearIntervals() {
    clearInterval(this.interval);
  }

  /**
   * Loads the cards from GitHub API.
   * Loads cards of every column and updates the currently displayed column cards.
   */
  loadCards() {
    this.getProjectColumns().then(c => {
      this.columns = c;

      let columnsLoaded = 0;
      for(const column of this.columns) {
        this.getColumnCards(column.id).then(cards => {
          this.columnCards[column.id] = cards;
          columnsLoaded++;
          if(columnsLoaded == this.columns.length) {
            if(this.selectedColumn) this.displayCards(this.selectedColumn);
            else this.displayCards(this.columns[0]);
          }
        });
      }
    });
  }

  /**
   * Displays the cards of the given column.
   * @param column
   */
  displayCards(column) {
    this.selectedColumn = column;
    const cardsContent = this.shadowRoot.getElementById("cards-content");
    while(cardsContent.firstChild) cardsContent.removeChild(cardsContent.firstChild);

    const cards = this.columnCards[column.id];

    for(const card of cards) {
      const paperCard = document.createElement("paper-card");
      paperCard.style.setProperty("width", "100%");
      paperCard.style.setProperty("margin-top", "0.5em");

      // check card type (issues are currently not supported)
      if(card.note != null) {
        // standard card
        const div = document.createElement("div");
        div.style.setProperty("margin-left", "1em");

        const pNote = document.createElement("p");
        pNote.style.setProperty("margin-bottom", "0.5em");
        pNote.innerText = card.note;
        div.appendChild(pNote);

        const pUser = document.createElement("p");
        pUser.style.setProperty("margin-top", "0");
        pUser.style.setProperty("font-size", "smaller");
        pUser.style.setProperty("color", "#838383");
        pUser.innerText = "Added by " + card.creator.login;
        div.appendChild(pUser);

        paperCard.appendChild(div);
      }

      cardsContent.appendChild(paperCard);
    }
  }

  /**
   * Loads the columns of a GitHub project.
   * Uses this.gitHubProjectId as the id of the GitHub project.
   * @returns {Promise<unknown>}
   */
  getProjectColumns() {
    return new Promise((columnsLoaded, loadingFailed) => {
      fetch("https://api.github.com/projects/" + this.gitHubProjectId + "/columns", {
        method: "GET",
        headers: {
          "Accept": "application/vnd.github.inertia-preview+json",
          "Authorization": "token " + this.accessToken
        }
      }).then(response => {
        if(response.ok) {
          response.json().then(data => {
            columnsLoaded(data);
          });
        } else {
          loadingFailed();
        }
      });
    });
  }

  /**
   * Loads the cards of a column of a GitHub project.
   * @param columnId Id of the column where the cards should be returned for.
   * @returns {Promise<unknown>}
   */
  getColumnCards(columnId) {
    return new Promise((cardsLoaded, loadingFailed) => {
      fetch("https://api.github.com/projects/columns/" + columnId + "/cards", {
        method: "GET",
        headers: {
          "Accept": "application/vnd.github.inertia-preview+json",
          "Authorization": "token " + this.accessToken
        }
      }).then(response => {
        if(response.ok) {
          response.json().then(data => {
            cardsLoaded(data);
          });
        } else {
          laodingFailed();
        }
      });
    });
  }

  _onAddCardClicked() {
    const note = this.shadowRoot.getElementById("input-note").value;
    if(!note) return;
    this.createNewCard(this.selectedColumn.id, note).then(_ => {
      this.shadowRoot.getElementById("input-note").value = ""
      this.loadCards();
    });
  }

  /**
   * Sends an API request to create a new card in the given column.
   * @param columnId Id of the column where the card should be added to.
   * @param note Note used for the card.
   * @returns {Promise<unknown>}
   */
  createNewCard(columnId, note) {
    return new Promise((cardCreated, creationFailed) => {
      fetch("https://api.github.com/projects/columns/" + columnId + "/cards", {
        method: "POST",
        headers: {
          "Accept": "application/vnd.github.inertia-preview+json",
          "Authorization": "token " + this.accessToken
        },
        body: JSON.stringify({
          note
        })
      }).then(response => {
        if(response.ok) {
          response.json().then(data => {
            cardCreated();
          });
        } else {
          creationFailed();
        }
      });
    });
  }
}

customElements.define('github-projects-widget', GitHubProjectsWidget);
