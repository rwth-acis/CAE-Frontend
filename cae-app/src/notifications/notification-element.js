import {html, LitElement} from 'lit-element';
import '@polymer/iron-icon/iron-icon.js';
import Static from "../static";
import Auth from "../util/auth";

/**
 * LitElement used to display invitations to projects.
 */
class NotificationElement extends LitElement {
  render() {
    return html`
      <style>
        :host {
          font-family: Roboto;
        }
        .main {
          margin-left: 1em;
          margin-top: 1em;
          max-width: 300px;
        }
        .icon-no {
          color: #DB4437;
          margin-left: auto;
          margin-top: auto;
          margin-bottom: auto;
        }
        .icon-yes {
          color: #0F9D58;
          margin-left: 0.5em;
          margin-top: auto;
          margin-bottom: auto;
        }
        .icon:hover {
          background: #dcdcdc;
        }
        .separator {
           border-top: thin solid #e1e1e1;
        }
      </style>
      <div class="main">
        <p><b>Project Invitations</b></p>
        ${this.invitations && this.invitations.length > 0 ? html`
          <div>
            <p>You are invited to the following projects:</p>
            <div class="separator"></div>
            ${this.invitations.map(invitation => html`
              <div style="display: flex">
                <p>${invitation.projectName}</p>
                <iron-icon icon="clear" class="icon-no icon" @click="${() => this._declineInvitation(invitation)}"></iron-icon>
                <iron-icon icon="check" class="icon-yes icon" @click="${() => this._acceptInvitation(invitation)}"></iron-icon>
              </div>
              <div class="separator"></div>
            `)}
          </div>
        ` : html`
          <p>You do not have any open project invitations.</p>
        `}
      </div>
    `;
  }

  static get properties() {
    return {
      invitations: {
        type: Array
      }
    }
  }

  /**
   * Gets called by cae-static-app when the invitations are loaded.
   * @param invitations
   */
  setInvitations(invitations) {
    this.invitations = invitations;
  }

  _declineInvitation(invitation) {
    fetch(Static.ProjectManagementServiceURL + "/invitations/" + invitation.id, {
      method: "DELETE",
      headers: Auth.getAuthHeader()
    }).then(response => {
      if(response.ok) {
        this.reloadNotifications();
      }
    })
  }

  _acceptInvitation(invitation) {
    fetch(Static.ProjectManagementServiceURL + "/projects/" + invitation.projectId + "/users", {
      method: "POST",
      headers: Auth.getAuthHeader()
    }).then(response => {
      if(response.ok) {
        this.reloadNotifications();

        // user accepted invitation
        // thus, the project list of projects, where the user is a member of, changes
        // reload the users projects
        let event = new CustomEvent("reload-users-projects");
        this.dispatchEvent(event);
      }
    });
  }

  reloadNotifications() {
    let event = new CustomEvent("reload-notifications");
    this.dispatchEvent(event);
  }
}

customElements.define('notification-element', NotificationElement);
