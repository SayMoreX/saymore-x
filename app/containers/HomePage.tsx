import Home from "../components/Home";
import * as React from "react";
import * as mobx from "mobx";
import { observer } from "mobx-react";
import { Project, ProjectHolder } from "../model/Project/Project";
import * as fs from "fs-extra";
import * as ncp from "ncp";
import * as Path from "path";
import { remote, OpenDialogOptions } from "electron";
import CreateProjectDialog from "../components/project/CreateProjectDialog";
const { app } = require("electron").remote;
const { Menu } = require("electron");
import Store = require("electron-store");
import SayLessMenu from "../menu";
import "./StartScreen.scss";
const saylessicon = require("../img/icon.png");

// tslint:disable-next-line:no-empty-interface
interface IProps {}
interface IState {
  showModal: boolean;
  useSampleProject: boolean;
}

@observer
export default class HomePage extends React.Component<IProps, IState> {
  // we wrap the project in a "holder" so that mobx can observe when we change it
  @mobx.observable public projectHolder: ProjectHolder;
  private userSettings: Store;
  private menu: SayLessMenu;

  constructor(props: IProps) {
    super(props);
    this.projectHolder = new ProjectHolder();
    this.state = {
      showModal: false,
      useSampleProject: false //enhance: this is a really ugly way to control this behavior
    };
    //console.log("0000000" + app.getPath("userData"));
    this.userSettings = new Store({ name: "saymore-user-settings" });
    const previousDirectory = this.userSettings.get("previousProjectDirectory");
    if (previousDirectory && fs.existsSync(previousDirectory)) {
      const project = Project.fromDirectory(previousDirectory);
      this.projectHolder.setProject(project);
    } else {
      this.projectHolder.setProject(null);
    }
  }
  public createProject(useSample: boolean) {
    this.setState({ showModal: true, useSampleProject: useSample });
  }

  public componentWillMount() {
    this.menu = new SayLessMenu(this);
    this.menu.buildMainMenu();
    this.menu.setupContentMenu();
  }
  private handleCreateProjectDialogClose(
    directory: string,
    useSampleProject: boolean
  ) {
    this.setState({ showModal: false });
    if (directory) {
      fs.ensureDirSync(directory);
      if (useSampleProject) {
        const sampleSourceDir = fs.realpathSync("sample data/Edolo sample");
        ncp.ncp(sampleSourceDir, directory, err => {
          const projectName = Path.basename(directory);
          fs.renameSync(
            Path.join(directory, "Edolo Sample.sprj"),
            Path.join(directory, projectName + ".sprj")
          );
          this.projectHolder.setProject(Project.fromDirectory(directory));
        });
      } else {
        this.projectHolder.setProject(Project.fromDirectory(directory));
      }
      this.userSettings.set("previousProjectDirectory", directory);
    }
  }

  public render() {
    const title = this.projectHolder.project
      ? this.projectHolder.project.displayName + " - SayLess"
      : "SayLess";

    remote.getCurrentWindow().setTitle(title);
    return (
      <div style={{ height: "100%" }}>
        {this.projectHolder.project ? (
          <Home
            project={this.projectHolder.project}
            authorityLists={this.projectHolder.project.authorityLists}
            menu={this.menu}
          />
        ) : (
          <div className={"startScreen"}>
            <div className={"top"}>
              <img src={require("../img/icon.png")} />
              <h1>
                SayMore <span>Mac</span>
              </h1>
            </div>
            <div className={"choices"}>
              <img src={require("../img/create.png")} />
              <a
                className={"creatNewProjectLink"}
                id="creatNewProjectLink"
                onClick={() => this.createProject(false)}
              >
                Create New Project
              </a>
              <br />
              <img src={require("../img/open.png")} />
              <a onClick={() => this.openProject()}>Open SayMore Project</a>
              <br />
              <img src={require("../img/sample.png")} />
              <a
                id="createNewProjectWithSampleDataLink"
                onClick={() => {
                  this.createProject(true);
                }}
              >
                Create New Project with Sample Data
              </a>
            </div>
          </div>
        )}
        {this.state.showModal ? (
          <CreateProjectDialog
            isOpen={this.state.showModal}
            useSampleProject={this.state.useSampleProject}
            callback={(answer, useSampleProject) =>
              this.handleCreateProjectDialogClose(answer, useSampleProject)
            }
          />
        ) : (
          ""
        )}
      </div>
    );
  }

  public openProject() {
    const defaultProjectParentDirectory = Path.join(
      app.getPath("documents"),
      "SayLess"
    );

    const options: OpenDialogOptions = {
      title: "Open Project...",
      defaultPath: defaultProjectParentDirectory,
      //note, we'd like to use openDirectory instead, but in Jan 2018 you can't limit to just folders that
      // look like saymore projects
      properties: ["openFile"],
      filters: [{ name: "SayMore/SayLess Project Files", extensions: ["sprj"] }]
    };
    remote.dialog.showOpenDialog(remote.getCurrentWindow(), options, paths => {
      if (paths) {
        const directory = Path.dirname(paths[0]);
        this.projectHolder.setProject(
          Project.fromDirectory(fs.realpathSync(directory))
        );
        this.userSettings.set("previousProjectDirectory", directory);
      }
    });
  }
}
