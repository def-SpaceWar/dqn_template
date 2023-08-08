import { DQNAgent } from "./dqn_agent";
import { makeModel } from "./model";
import "./style.css";

const model = makeModel(0, 0);
const agent = new DQNAgent(model);
agent;
