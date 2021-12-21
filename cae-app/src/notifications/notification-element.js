import {html, LitElement} from 'lit-element';
import '@polymer/iron-icon/iron-icon.js';

/**
 * LitElement used to display information as a contact email.
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
      </style>
      <div class="main">
        <p>Want to participate in one of our example projects? Drop us a mail at 
        <a href="mailto:tech4comp@dbis.rwth-aachen.de">tech4comp@dbis.rwth-aachen.de</a>!</p>
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
}

customElements.define('notification-element', NotificationElement);
