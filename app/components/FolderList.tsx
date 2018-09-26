import * as React from "react";
import { default as ReactTable, Resize } from "react-table";

import { Folder, IFolderSelection } from "../model/Folder";
import * as mobxReact from "mobx-react";
import * as mobx from "mobx";
// tslint:disable-next-line:no-submodule-imports
import { Field, FieldType, HasConsentField } from "../model/field/Field";
import "./FolderList.scss";
import { locate } from "../crossPlatformUtilities";
import { ReactTableColumnWidthManager } from "./ReactTableColumnWidthManager";
const titleCase = require("title-case");

export interface IProps {
  nameForPersistingUsersTableConfiguration: string;
  folders: Folder[];
  selectedFolder: IFolderSelection;
  columns: string[];
  columnWidths: number[];
}
@mobxReact.observer
export class FolderList extends React.Component<IProps> {
  private hasConsentPath = locate("assets/hasConsent.png");
  private noConsentPath = locate("assets/noConsent.png");
  private m: mobx.IReactionDisposer;
  private columnWidthManager: ReactTableColumnWidthManager;
  constructor(props: IProps) {
    super(props);
    this.columnWidthManager = new ReactTableColumnWidthManager(
      this.props.nameForPersistingUsersTableConfiguration + ".columnWidths",
      this.props.columns,
      this.props.columnWidths
    );
  }

  public render() {
    // Because the class has the mobxReact.observer decorator, mobx is watching the render function.
    // But what happens inside the table's cells is invisible to mobx; it doesn't
    // have a way of knowing that these are reliant on the filename of the file.
    // See https://mobx.js.org/best/react.html#mobx-only-tracks-data-accessed-for-observer-components-if-they-are-directly-accessed-by-render
    // However the <Observer> wrapper suggested by that link messes up the display of the table.
    // So for now, we just access every filename right here, while mobx is watching. That's enough to get it to trigger a re-render
    // when the user does something that causes a rename.
    const mobxDummyWatchForDisplayName = this.props.folders.map(
      f => f.displayName
    );
    // Similarly, the consent mark is derived from having some child file that has the word "Consent" in the file name.
    // We explicitly do something with each file name, so that mobx will know it should re-run the render function
    // as needed.
    const mobxDummyWatchForConsentChange = this.props.folders.map(folder => {
      folder.files.map(child => child.describedFilePath);
    });

    const columns = this.props.columns.map((key, index) => {
      const c: object = {
        id: key,
        width: this.columnWidthManager.columnWidths[key],
        className: key,
        Header:
          this.props.folders.length > 0
            ? this.props.folders[0].properties.getValueOrThrow(key).englishLabel
            : titleCase(key),
        accessor: (f: Folder) => {
          const field = f.properties.getValueOrThrow(key);
          if (field.type === FieldType.Text) {
            return field.toString();
          }
          if (field.type === FieldType.Date) {
            return field.asDateDisplayString();
          }
          if (field.type === FieldType.Function) {
            const consentField = field as HasConsentField;
            if (consentField.hasConsent()) {
              return (
                <img
                  src={this.hasConsentPath}
                  title="Found file with a name containing 'Consent'"
                />
              );
            } else {
              return (
                <img
                  src={this.noConsentPath}
                  title="Found no file with a name containing 'Consent'"
                />
              );
            }
          }
          return "ERROR";
        }
      };
      return c;
    });

    return (
      <div className={"folderList"}>
        <ReactTable
          showPagination={false}
          data={this.props.folders}
          columns={columns}
          onResizedChange={(resizedState: Resize[]) =>
            this.columnWidthManager.handleResizedChange(resizedState)
          }
          pageSize={this.props.folders.length} // show all rows. Watch https://github.com/react-tools/react-table/issues/1054 for a better way someday?
          getTrProps={(state: any, rowInfo: any, column: any) => {
            //NB: "rowInfo.row" is a subset of things that are mentioned with an accessor. "original" is the original.
            return {
              onClick: (e: any, t: any) => {
                // console.log(
                //   "row " + JSON.stringify(rowInfo.original.directory)
                // );
                this.props.selectedFolder.index = rowInfo.index;
                this.setState({}); // trigger re-render so that the following style: takes effect
              },
              className:
                rowInfo && rowInfo.index === this.props.selectedFolder.index
                  ? "selected"
                  : ""
            };
          }}
        />
      </div>
    );
  }
}

export default FolderList;
