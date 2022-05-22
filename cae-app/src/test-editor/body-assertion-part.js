import {html, LitElement} from 'lit-element';
import BootstrapUtil from '../util/bootstrap-util';
import Assertions from './assertions';

class BodyAssertionPart extends LitElement {
  render() {
    return html`
      <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
      </head>

      <div style="display: contents"> 

        <!-- Select for operator -->
        <select id="select-assertion-operator" class="form-select form-select-sm w-auto" style="margin-left: 0.5em" ?disabled=${!this.editModeOn}>
          ${this.getOperatorSelectItems().map(operator => html`
            <option value=${operator.operatorId ? operator.operatorId : operator.id}>
              ${operator.value}
            </option>
          `)}
        </select>

        <!-- Some operators are followed by an user input, e.g., the operator "has field" requires user input -->
        <!-- Some operators are not followed by an user input directly, e.g., the operator "has list entry that" is followed by another operator -->

        <!-- If currently selected operator is followed by an input which is an input field -->
        ${this.selectedOperatorHasInput() && this.selectedOperatorHasInputField() ? html`
          <input id="input-field" @change=${(e) => this.onInputFieldChanged(e)} type="text" class="form-control" style="width: 6em; margin-left: 0.5em; margin-top: auto; margin-bottom: auto" ?disabled=${!this.editModeOn}>
        `: html``}

        <!-- If currently selected operator is followed by an input which is a selection -->
        ${this.selectedOperatorHasInput() && !this.selectedOperatorHasInputField() ? html`
          <select id="input-select" @change=${(e) => this.onInputSelectChanged(e)} class="form-select form-select-sm w-auto" style="margin-left: 0.5em" ?disabled=${!this.editModeOn}>
            ${this.getInputSelectItems().map(field => html`
              <option value=${field.id}>
                ${field.value}
              </option>
            `)}
          </select>
        `: html``}

        <!-- If currently selected operator is followed by another operator -->
        ${this.selectedOperatorHasFollowOperator() ? html`
          <body-assertion-part 
            selectableOperatorIds=${JSON.stringify(this.getFollowedByIds())}
            currentOperator=${JSON.stringify(this.getFollowedByObject())}
            ?editModeOn=${this.editModeOn}
            @operator-updated=${(e) => this.onBodyAssertionOperatorUpdated(e.detail.operator)}
            style="display: contents"></body-assertion-part>
        `: html``}

        <!-- There is also the possibility for an operator to have an optional following operator -->
        <!-- This optional operator is hidden by default, but a button allows to show it -->
        ${this.selectedOperatorHasOptionalFollowOperator() ? html`
          ${this.currentOperator && !this.currentOperator.followedBy ? html`
            <button id="add-operator-button" type="button" @click=${this.addOperatorClicked} class="btn btn-secondary" style="margin-left: 0.5em; margin-top: auto; margin-bottom: auto"
              data-bs-toggle="tooltip" data-bs-placement="top" title="Extend assertion">+</button>
          `: html``}
        `: html``}

      </div>

    `;
  }

  static get properties() {
    return {
      /**
       * Ids of the operators that can be selected.
       */
      selectableOperatorIds: {type: Array },
    
      /**
       * Current JSON representation of the operator.
       */
      currentOperator: { type: Object },

      editModeOn: {type: Boolean }
    };
  }

  firstUpdated() {
    // request update, otherwise the input/select for the operator is not rendered
    this.requestUpdate();

    // if the selected operator changes, request update
    this.shadowRoot.getElementById("select-assertion-operator").addEventListener("change", (e) => {
      const newOperatorId = parseInt(e.target.value);
      this.currentOperator = Assertions.getInitialOperator(newOperatorId);
      this.sendOperatorUpdatedEvent();
    });
  }

  onInputFieldChanged(e) {
    if(this.currentOperator.input) {
      this.currentOperator.input.value = e.target.value;
    } else {
      this.currentOperator.input = {
        id: Assertions.INPUT_FIELD.id,
        value: e.target.value
      };
    }
    this.sendOperatorUpdatedEvent();
  }

  onInputSelectChanged(e) {
    if(this.currentOperator.input) {
      this.currentOperator.input.id = parseInt(e.target.value);
    } else {
      this.currentOperator.input = {
        id: parseInt(e.target.value)
      };
    }
    this.sendOperatorUpdatedEvent();
  }

  updated(changedProperties) {
    BootstrapUtil.setupBootstrapTooltips(this.shadowRoot);

    if(this.currentOperator && Object.keys(this.currentOperator).includes("operatorId")) {
      this.shadowRoot.getElementById("select-assertion-operator").value = this.currentOperator.operatorId;

      if(this.currentOperator.input && this.currentOperator.input.id == Assertions.INPUT_FIELD.id) {
        this.shadowRoot.getElementById("input-field").value = this.currentOperator.input.value;
      }

      if(this.currentOperator.input && this.currentOperator.input.id != Assertions.INPUT_FIELD.id && this.currentOperator.input.id != Assertions.NO_INPUT.id) {
        // select input 
        this.shadowRoot.getElementById("input-select").value = this.currentOperator.input.id;
      }
    }

    // if add-operator-button is not visible, then remove all tooltips
    if(!(this.selectedOperatorHasOptionalFollowOperator() && this.currentOperator && !this.currentOperator.followedBy)) {
      document.querySelectorAll(".tooltip").forEach(element => {
        element.hidden = true;
      });
    }

    if(changedProperties.has("currentOperator")) {
      this.requestUpdate();
    }
  }

  /**
   * Returns the currently selected operator as a JSON object.
   * @returns Currently selected operator as a JSON object.
   */
  getSelectedOperator() {
    if(!this.shadowRoot.getElementById("select-assertion-operator")) return {};

    // value of operator-select element is the id of the operator
    const selectedValue = this.shadowRoot.getElementById("select-assertion-operator").value;
    // find the operator by its id
    return Assertions.RESPONSE_BODY_OPERATORS.find(operator => operator.id == selectedValue);
  }

  /**
   * Checks if the currently selected operator is followed by an input (either input field or selection).
   * @returns True, if the currently selected operator is followed by an input (either input field or selection), false otherwise.
   */
  selectedOperatorHasInput() {
    if(!this.shadowRoot || !this.shadowRoot.getElementById("select-assertion-operator")) return false;

    return !this.getSelectedOperator().input.includes(Assertions.NO_INPUT.id);
  }

  /**
   * Checks if the currently selected operator is followed by an input field.
   * @returns True, if the currently selected operator is followed by an input field, false otherwise.
   */
  selectedOperatorHasInputField() {
    return this.getSelectedOperator().input.includes(Assertions.INPUT_FIELD.id);
  }

  /**
   * Checks if the currently selected operator can be followed by an optional operator.
   * @returns True, if the currently selected operator can be followed by an optional operator, false otherwise.
   */
  selectedOperatorHasOptionalFollowOperator() {
    if(!this.editModeOn) return false;

    const selectedOperator = this.getSelectedOperator();
    return selectedOperator.optionallyFollowedBy && selectedOperator.optionallyFollowedBy.length > 0;
  }

  /**
   * Checks if the currently selected operator needs to be followed by another operator.
   * @returns True, if the currently selected operator needs to be followed by another operator, false otherwise.
   */
  selectedOperatorHasFollowOperator() {
    if(this.editModeOn) {
      if(this.currentOperator && Object.keys(this.currentOperator).includes("followedBy")) return true;

      const selectedOperator = this.getSelectedOperator();
      return selectedOperator.followedBy && selectedOperator.followedBy.length > 0;
    } else {
      return Object.keys(this.currentOperator).includes("followedBy");
    }
  }

  /**
   * If edit mode is enabled:
   * Returns a list of operator ids that might follow the current operator.
   * If edit mode is disabled:
   * Returns a list that only contains the id of the next operator.
   * @returns 
   */
  getFollowedByIds() {
    if(this.editModeOn) {
      // if the current operator already has a following operator displayed, then this next operator is 
      // stored as this.currentOperator.followedBy (even if it was originally an optionalFollowedBy operator).
      if(this.currentOperator && this.currentOperator.followedBy && !this.getSelectedOperator().followedBy) return this.getSelectedOperator().optionallyFollowedBy;

      // return list of operator ids that might follow the current operator
      return this.getSelectedOperator().followedBy;
    } else {
      return [this.currentOperator.followedBy.operatorId];
    }
  }

  /**
   * Returns the following operator as a JSON object.
   * @returns Following operator as a JSON object.
   */
  getFollowedByObject() {
    if(this.editModeOn) {
      // if the next operator is already stored, we can return it
      if(this.currentOperator && this.currentOperator.followedBy) return this.currentOperator.followedBy;

      // find current operator
      const operator = Assertions.RESPONSE_BODY_OPERATORS.find(operator => operator.id == this.currentOperator.operatorId);
      // by default the first possible followedBy operator is selected
      if(operator.followedBy) {
        return {
          id: Math.floor(Math.random() * 999999),
          operatorId: operator.followedBy[0]
        };
      } else {
        return {};
      }
    } else {
      return this.currentOperator.followedBy;
    }
  }

  /**
   * Click event handler for the button that allows to add another operator at the end of the assertion.
   */
  addOperatorClicked() {
    this.currentOperator.followedBy = Assertions.getInitialOperator( this.getSelectedOperator().optionallyFollowedBy[0]);
    this.sendOperatorUpdatedEvent();
  }

  /**
   * Returns a list of response body operators that are currently selectable.
   * @returns List of response body operators that are currently selectable.
   */
  getOperatorSelectItems() {
    return Assertions.RESPONSE_BODY_OPERATORS.filter(element => this.selectableOperatorIds.filter(e => e == element.id).length > 0);
  }

  /**
   * Returns a list of inputs that are currently selectable.
   * @returns List of inputs that are currently selectable.
   */
  getInputSelectItems() {
    return Assertions.INPUTS.filter(field => this.getSelectedOperator().input.filter(i => i == field.id).length > 0);
  }

  /**
   * Fires an event that notifies the parent element that the operator has been updated.
   */
  sendOperatorUpdatedEvent() {
    this.dispatchEvent(new CustomEvent("operator-updated", {
      detail: {
        operator: this.currentOperator
      }
    }));
  }

  /**
   * Handler for "operator-updated" event fired by the following body-assertion-part element.
   * @param {*} operator Updated operator.
   */
  onBodyAssertionOperatorUpdated(operator) {
    this.currentOperator.followedBy = operator;
    this.sendOperatorUpdatedEvent();
  }
}

customElements.define('body-assertion-part', BodyAssertionPart);