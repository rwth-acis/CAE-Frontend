import {html, LitElement} from 'lit-element';
import './project-info';
import '@polymer/iron-flex-layout/iron-flex-layout-classes';
import Auth from "../util/auth";
import Static from "../static";
import Common from "../util/common";
import {ProjectList} from "@rwth-acis/las2peer-project-service-frontend";

/**
 * PolymerElement for the project management page of the CAE.
 * TODO: Update Documentation when functionality of this element is final.
 * This element will contain the Project Management Widget and the
 * Project User Widget.
 */
class ProjectManagement extends LitElement {
  render() {
    return html`
      <!--<p>This is the Project Management page.</p>
      <a href="/cae-modeling">Link to Modeling</a>-->
      
      <style>
        :host {
          font-family: Roboto;
        }
      </style>
      
      <custom-style>
        <style is="custom-style">
          .flex-horizontal-with-ratios {
            @apply --layout-horizontal;
          }
          .flex-project-info {
            @apply --layout-flex;
          }
          .flex-project-explorer {
            @apply --layout-flex;
            margin-right: 1em;
          }
        </style>
      </custom-style>
      
      ${Auth.isAccessTokenAvailable() ? html`
        <div class="container flex-horizontal-with-ratios">
          <div class="flex-project-explorer">
            <project-list id="project-list" system="CAE"
              projectServiceURL=${Static.ProjectServiceURL}
              contactServiceURL="${Static.ContactServiceURL}/contactservice"
              yjsAddress="${Static.YjsAddress}"
              @projects-loaded=${(e) => this._onProjectListLoaded(e.detail)}
              @project-selected=${(e) => this._onProjectSelected(e.detail)}></project-list>
          </div>
          <div class="flex-project-info">
            <project-info @change-view=${(e) => this._changeView(e)} @update-menu=${(e) => this._updateMenu(e.detail)} 
                @reload-projects=${this._reloadProjects} id="project-info"></project-info>
          </div>
        </div>
      ` : html `
        <div style="margin-left: 1em">
          <p>Please login first.</p>
        </div>
      `}
    `
  }

  /**
   * Redirects change-view events from children e.g. project-info to cae-static-app.
   * @param e Change-view event, sent from child element.
   * @private
   */
  _changeView(e) {
    let event = new CustomEvent("change-view", {
      detail: {
        view: e.detail.view
      }
    });
    this.dispatchEvent(event);
  }

  /**
   * Redirects update-menu events from the project-info child to the cae-static-app.
   * @private
   */
  _updateMenu(detail) {
    let event = new CustomEvent("update-menu", {
      detail: detail
    });
    this.dispatchEvent(event);
  }

  /**
   * Gets called when a user selects a project in the project explorer.
   * Notifies the project user widget about this event.
   * @param eventDetail Details of the event sent from the explorer.
   * @private
   */
  _onProjectSelected(eventDetail) {
    this.getProjectInfo()._onProjectSelected(eventDetail.project);
  }

  /**
   * Gets called when the list of projects by the user is loaded in the
   * project explorer.
   * @param eventDetail Details of the event sent from the explorer.
   * @private
   */
  _onProjectListLoaded(eventDetail) {
    this.getProjectInfo()._onProjectListLoaded(eventDetail.projects);

    // update list of online users
    const mapProjectRooms = {};
    for(let project of eventDetail.projects) {
      const roomList = [];
      for(let component of project.metadata.components) {
        roomList.push(Common.getYjsRoomNameForVersionedModel(component.versionedModelId));
      }
      mapProjectRooms[project.name] = roomList;
    }
    this.getProjectList().setOnlineUserListYjsRooms(mapProjectRooms);
  }

  _reloadProjects() {
    this.getProjectList().showProjects(false);
  }

  getProjectInfo() {
    return this.shadowRoot.getElementById("project-info");
  }

  getProjectList() {
    return this.shadowRoot.getElementById("project-list");
  }
}

customElements.define('project-management', ProjectManagement);
