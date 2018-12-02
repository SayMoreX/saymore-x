import * as React from "react";
import { observer } from "mobx-react";
import TextFieldEdit from "./TextFieldEdit";
import { Field, FieldType, FieldVisibility } from "../model/field/Field";
import DateFieldEdit from "./DateFieldEdit";
import ClosedChoiceEdit from "./ClosedChoiceEdit";
import { Folder } from "../model/Folder";
import GenreChooser from "./session/GenreChooser";
import { AuthorityLists } from "../model/Project/AuthorityLists/AuthorityLists";
import AccessChooser from "./session/AccessChooser";
import PeopleChooser from "./session/PeopleChooser";
import "./session/SessionForm.scss";
import "./Form.scss";
import CustomFieldsTable from "./CustomFieldsTable";
import AdditionalFieldsTable from "./MoreFieldsTable";
import IsoLanguageEdit from "./IsoLanguageEdit";
import { Trans, t } from "@lingui/macro";

import { setupI18n, I18n } from "@lingui/core";
// messages.js is generated by the lingui cli "compile" command
const englishMessages = require("../../locale/en/messages.json");
const spanishMessages = require("../../locale/es/messages.json");

export interface IProps {
  folder: Folder;
  form: string; // only fields with this "form" property will show

  formClass: string; // used to activate the right stylesheet
  authorityLists: AuthorityLists;
  //customFieldNames: string[];
  fieldThatControlsFileNames?: string;
  fieldThatControlsFileNamesMightHaveChanged?: (fieldName: string) => void;
  validateFieldThatControlsFileNames?: (value: string) => boolean;
}

/** Constructs a form by looking at the properties of the given fields */
@observer
export default class AutoForm extends React.Component<IProps> {
  private sortedKeys: string[];
  private i18n: I18n;

  constructor(props: IProps) {
    super(props);

    //setup the i18n object with active language and catalogs
    this.i18n = setupI18n({
      language: "es",
      catalogs: {
        //en: englishMessages,
        es: spanishMessages
      }
    });
    this.i18n = this.i18n.use("es");
  }

  private makeEdit(field: Field): JSX.Element {
    //console.log("makeEdit(" + JSON.stringify(field));
    switch (field.type) {
      case FieldType.Text:
        const f = field as Field;
        if (f.choices && f.choices.length > 0) {
          return (
            <ClosedChoiceEdit
              includeLabel={true}
              field={f}
              key={field.key}
              className={field.cssClass}
            />
          );
        } else if (f.definition && f.definition.key === "access") {
          return (
            <AccessChooser
              key={f.key} // for some reason we get a key error without this
              field={f}
              authorityLists={this.props.authorityLists}
            />
          );
        } else if (f.definition.key === "participants") {
          return (
            <PeopleChooser
              key={f.key} // for some reason we get a key error without this
              field={field as Field}
              className={field.cssClass}
              getPeopleNames={this.props.authorityLists.getPeopleNames}
            />
          );
        } else if (
          f.definition &&
          f.definition.complexChoices &&
          f.definition.complexChoices.length > 0
        ) {
          return (
            <GenreChooser
              field={f}
              key={field.key}
              className={field.cssClass}
            />
          );
        } else if (
          this.props.fieldThatControlsFileNamesMightHaveChanged &&
          this.props.fieldThatControlsFileNames &&
          field.key === this.props.fieldThatControlsFileNames
        ) {
          return (
            <TextFieldEdit
              className={field.cssClass}
              key={field.key}
              field={field as Field}
              onBlur={() =>
                // for some reason typescript isn't noticing that I have already checked that this isn't null,
                // so the || console.log is just to pacify it
                (this.props.fieldThatControlsFileNamesMightHaveChanged ||
                  console.log)(this.props.fieldThatControlsFileNames || "")
              }
              validate={value =>
                !this.props.validateFieldThatControlsFileNames ||
                this.props.validateFieldThatControlsFileNames(value)
              }
            />
          );
        } else {
          return (
            <TextFieldEdit
              className={field.cssClass}
              key={field.key}
              field={field as Field}
            />
          );
        }
      case FieldType.Date:
        return (
          <DateFieldEdit
            className={field.cssClass}
            key={field.key}
            date={field as Field}
          />
        );
      case FieldType.Language:
        return (
          <IsoLanguageEdit
            key={field.key}
            className={field.cssClass}
            language={field}
          />
        );
      default:
        throw Error("unknown type: " + field.type.toString());
    }
  }

  public render() {
    this.sortedKeys = this.props.folder.properties
      .values()
      .filter(
        f =>
          f.definition &&
          f.definition.showOnAutoForm &&
          !f.definition.isCustom &&
          !f.definition.isAdditional
      )
      .sort((a, b) => {
        const x =
          (a.definition && a.definition.order !== undefined
            ? a.definition.order
            : 1000) -
          (b.definition && b.definition.order !== undefined
            ? b.definition.order
            : 1000);

        return x;
      })
      .map(f => f.key);

    return (
      <form
        className={"autoForm " + this.props.form + " " + this.props.formClass}
      >
        {/* the lingui extractor sees this if not commented: */}
        {<Trans id="autoform.goodbye">goodbye default</Trans>}
        {<Trans>one</Trans>}
        {/* But it doesn't compile (update: does with babel set up juuuuuust right). gives Critical dependency: the request of a dependency is an expression */}
        {/* But it doesn't see this plain vanilla js with _ and t */}
        {/* Also the t doesn't compile.  */}
        {/* {this.i18n._(t("autoform.hello")`hello`)} */}
        {this.i18n._("autoform.hello", {}, { defaults: "hello default" })}
        {this.sortedKeys
          .map(k => this.props.folder.properties.getValueOrThrow(k))

          .filter(field => field.form === this.props.form)
          .map(field => this.makeEdit(field))}
        {this.props.folder.hasMoreFieldsTable ? (
          <AdditionalFieldsTable folder={this.props.folder} />
        ) : (
          ""
        )}
        {this.props.folder.hasCustomFieldsTable ? (
          <CustomFieldsTable file={this.props.folder.metadataFile!} />
        ) : (
          ""
        )}
      </form>
    );
  }
}
