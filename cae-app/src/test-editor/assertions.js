export default class Assertions {

  /**
   * Types of assertions that can be used in a test.
   */
  static ASSERTION_TYPE = {
    STATUS_CODE: {
      "id": 0,
      "value": "Status code"
    },
    RESPONSE_BODY: {
      "id": 1,
      "value": "Response body"
    }
  };

  /**
   * These are the status codes that can be used in the CAE microservice model.
   */
  static STATUS_CODES = [200, 201, 400, 401, 404, 409, 500];

  /**
   * The comparison operators that can be used to compare the requests resulting status code 
   * with a selected status code.
   */
  static STATUS_CODE_COMPARISON_OPERATORS = [
    {
      "id": 0,
      "value": "equals"
    },
    {
      "id": 1,
      "value": "not equals"
    }
  ];

  /**
   * If an operator is not followed by an user input directly, then the "input" value of the 
   * operator is set to [NO_INPUT].
   * Example: The operator "has list entry that" is always followed by another operator (e.g., "has type").
   */
  static NO_INPUT = {
    "id": 0,
    "value": "No input"
  };

  /**
   * If an operator is followed by an input field, then the "input" value of the operator is
   * set to [INPUT_FIELD].
   */
  static INPUT_FIELD = {
    "id": 1,
    "value": "Input field"
  };
  
  /**
   * All possible inputs for the operators.
   * Can either be no input, an input field or a selection (e.g., containing types as "JSON Object").
   */
  static INPUTS = [
    Assertions.NO_INPUT,
    Assertions.INPUT_FIELD,
    {
      "id": 2,
      "value": "JSON Object"
    },
    {
      "id": 3,
      "value": "JSON Array"
    },
    {
      "id": 4,
      "value": "String"
    },
    {
      "id": 5,
      "value": "Number"
    },
    {
      "id": 6,
      "value": "Boolean"
    }
  ];

  static RESPONSE_BODY_OPERATOR_HAS_TYPE_ID = 0;

  /**
   * Defines the operators that can be used in "Request Body" assertions.
   * For each operator, the "value", which is shown in the dropdown menu of the UI, is defined.
   * The "input" value needs to be set to a list of inputs that are possible for the operator (containing the ids of the inputs).
   * The "followedBy" value needs to be set to a list of operators that can directly follow the operator (containing the ids of the operators). 
   * The "optionallyFollowedBy" value needs to be set to a list of operators that can optionally follow the operator (containing the ids of the operators).
   */
  static RESPONSE_BODY_OPERATORS = [
    {
      "id": Assertions.RESPONSE_BODY_OPERATOR_HAS_TYPE_ID,
      "value": "has type",
      "input": [2,3,4,5,6]
    },
    {
      "id": 1,
      "value": "has field",
      "input": [1],
      "optionallyFollowedBy": [0, 1, 2, 3]
    },
    {
      "id": 2,
      "value": "has list entry that",
      "input": [0],
      "followedBy": [0, 1]
    },
    {
      "id": 3,
      "value": "all list entries",
      "input": [0],
      "followedBy": [0, 1]
    }
  ];

  static getInitialOperator(operatorId) {
    const result = {
      id: Math.floor(Math.random() * 999999),
      operatorId: operatorId
    };

    // check if operator has input
    const operator = Assertions.RESPONSE_BODY_OPERATORS.find(operator => operator.id == operatorId);
    if(operator.input && operator.input.length > 0 && !operator.input.includes(Assertions.NO_INPUT.id)) {
      // operator has input
      // check if it is an input field or select
      if(operator.input[0] == Assertions.INPUT_FIELD.id) {
        // input is an input field
        result.input = {
          id: Assertions.INPUT_FIELD.id,
          value: ""
        };
      } else {
        // input is a selection
        result.input = {
          id: operator.input[0],
          value: Assertions.INPUTS.find(i => i.id == operator.input[0]).value
        };
      }
    }

    // check if operator is followed by another operator
    if(operator.followedBy && operator.followedBy.length > 0) {
      result.followedBy = Assertions.getInitialOperator(operator.followedBy[0]);
    }

    return result;
  }
}