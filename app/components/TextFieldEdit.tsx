import * as React from "react";
import { observer } from "mobx-react";
import { Field } from "../model/field/Field";
const titleCase = require("title-case");

export interface IProps {
  field: Field;
  hideLabel?: boolean;
  onBlur?: () => void;
}

// automatically update when the value changes
@observer
// the React.HTMLAttributes<HTMLDivElement> allows the use of "className=" on these fields
export default class TextFieldEdit extends React.Component<
  IProps & React.HTMLAttributes<HTMLDivElement>
> {
  constructor(props: IProps) {
    super(props);
    //this.onChange = this.onChange.bind(this);
    this.getLabel = this.getLabel.bind(this);
  }

  // this way gave us the wrong "this" (e.g 1st session when we were on the second
  // private onChange(event: React.FormEvent<HTMLInputElement>) {
  //   console.log("PolytextFiled setting field of " + this.props.text.default);
  //   this.props.text.setDefault(event.currentTarget.value);
  //   console.log("PolytextFiled now " + this.props.text.default);
  // }

  private static onChange(
    event: React.FormEvent<HTMLTextAreaElement>,
    text: Field
  ) {
    text.text = event.currentTarget.value;
  }

  private getLabel() {
    if (this.props.field === undefined) {
      return "Null Text";
    }
    return this.props.field.englishLabel;
  }

  private static getValue(text: Field): string {
    if (text === undefined) {
      return "Null Text";
    }
    return text.text;
  }

  public render() {
    return (
      <div
        className={
          "field " + (this.props.className ? this.props.className : "")
        }
      >
        {this.props.hideLabel ? "" : <label>{this.getLabel()}</label>}
        <textarea
          name={this.props.field.englishLabel} //what does this do? Maybe accessibility?
          value={TextFieldEdit.getValue(this.props.field)}
          onChange={event => TextFieldEdit.onChange(event, this.props.field)}
          onBlur={event => {
            if (this.props.onBlur) {
              this.props.onBlur();
            }
          }}
        />
      </div>
    );
  }
}
