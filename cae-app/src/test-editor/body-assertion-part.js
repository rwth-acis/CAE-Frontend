import {html, LitElement} from 'lit-element';
import Assertions from './assertions';

class BodyAssertionPart extends LitElement {
  render() {
    return html`
      <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
      </head>

      <div style="display: flex"> 

        <!-- Select for operator -->
        <select id="select-assertion-operator" class="form-select form-select-sm w-auto" style="margin-left: 0.5em">
          ${Assertions.RESPONSE_BODY_OPERATORS.filter(element => this.operator.filter(e => e == element.id).length > 0).map(operator => html`
            <option value=${operator.id}>
              ${operator.value}
            </option>
          `)}
        </select>

        <!-- Some operators are followed by an user input, e.g., the operator "has field" requires user input -->
        <!-- Some operators are not followed by an user input directly, e.g., the operator "has list entry that" is followed by another operator -->

        <!-- If currently selected operator is followed by an input which is an input field -->
        ${this.selectedOperatorHasInput() && this.selectedOperatorHasInputField() ? html`
          <input type="text" class="form-control" style="width: 6em; margin-left: 0.5em; margin-top: auto; margin-bottom: auto">
        `: html``}

        <!-- If currently selected operator is followed by an input which is a selection -->
        ${this.selectedOperatorHasInput() && !this.selectedOperatorHasInputField() ? html`
          <select class="form-select form-select-sm w-auto" style="margin-left: 0.5em">
            ${Assertions.INPUTS.filter(field => this.getSelectedOperator().input.filter(i => i == field.id).length > 0).map(field => html`
              <option value=${field.id}>
                ${field.value}
              </option>
            `)}
          </select>
        `: html``}

        <!-- If currently selected operator is followed by another operator -->
        ${this.selectedOperatorHasFollowOperator() ? html`
          <body-assertion-part operator=${JSON.stringify(this.getSelectedOperator().followedBy)}></body-assertion-part>
        `: html``}

        <!-- There is also the possibility for an operator to have an optional following operator -->
        <!-- This optional operator is hidden by default, but a button allows to show it -->
        ${this.selectedOperatorHasOptionalFollowOperator() ? html`
          <button id="add-operator-button" type="button" @click=${this.addOperatorClicked} class="btn btn-secondary" style="margin-left: 0.5em; margin-top: auto; margin-bottom: auto">+</button>
        
          <!-- The following div is used as a placeholder for the optional following operator -->
          <div id="optional-follow-operator-placeholder"></div>
        `: html``}

      </div>

    `;
  }

  static get properties() {
    return {
      operator: {type: Object},
    };
  }

  firstUpdated() {
    // request update, otherwise the input/select for the operator is not rendered
    this.requestUpdate();

    // if the selected operator changes, request update
    this.shadowRoot.getElementById("select-assertion-operator").addEventListener("change", (e) => {
      this.requestUpdate();
    });
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
    const selectedOperator = this.getSelectedOperator();
    return selectedOperator.optionallyFollowedBy && selectedOperator.optionallyFollowedBy.length > 0;
  }

  /**
   * Checks if the currently selected operator needs to be followed by another operator.
   * @returns True, if the currently selected operator needs to be followed by another operator, false otherwise.
   */
  selectedOperatorHasFollowOperator() {
    const selectedOperator = this.getSelectedOperator();
    return selectedOperator.followedBy && selectedOperator.followedBy.length > 0;
  }

  /**
   * Click event handler for the button that allows to add another operator at the end of the assertion.
   */
  addOperatorClicked() {
    // create new UI element for the new operator
    const followingOperator = new BodyAssertionPart();
    followingOperator.operator = this.getSelectedOperator().optionallyFollowedBy;
    this.shadowRoot.getElementById("optional-follow-operator-placeholder").appendChild(followingOperator);

    // hide the button
    this.shadowRoot.getElementById("add-operator-button").style.display = "none";
  }
}

customElements.define('body-assertion-part', BodyAssertionPart);