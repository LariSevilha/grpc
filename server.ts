import { loadSync } from "@grpc/proto-loader";
import {
  loadPackageDefinition,
  sendUnaryData,
  Server,
  ServerUnaryCall,
  ServerCredentials,
} from "@grpc/grpc-js";

// Carregar definição proto
const tasksDefs = loadSync("./task.proto");
const taskProto = loadPackageDefinition(tasksDefs) as any;

type Task = { id: number; title: string };
type TaskList = { tasks: Task[] };
type Empty = {};
type TaskRequest = { id: number };

const tasks: Task[] = [{ id: 1, title: "Prova dia 28, trazer bom humor" }];
let nextId = 2;

const grpcServer = new Server();

grpcServer.addService(taskProto.TaskService.service, {
  FindAll: (
    _: ServerUnaryCall<Empty, TaskList>,
    callback: sendUnaryData<TaskList>
  ) => {
    callback(null, { tasks });
  },

  InsertOne: (
    call: ServerUnaryCall<Task, Task>,
    callback: sendUnaryData<Task>
  ) => {
    const newTask: Task = { id: nextId++, title: call.request.title };
    tasks.push(newTask);
    callback(null, newTask);
  },

  FindOne: (
    call: ServerUnaryCall<TaskRequest, Task>,
    callback: sendUnaryData<Task>
  ) => {
    const found = tasks.find((task) => task.id === call.request.id);
    if (found) {
      callback(null, found);
    } else {
      callback({
        code: 5,  
        message: "Task not found",
      });
    }
  },

  DeleteOne: (
    call: ServerUnaryCall<Task, Task>,
    callback: sendUnaryData<Task>
  ) => {
    const index = tasks.findIndex((task) => task.id === call.request.id);
    if (index !== -1) {
      const removed = tasks.splice(index, 1)[0];
      callback(null, removed);
    } else {
      callback({
        code: 5,
        message: "Task not found",
      });
    }
  },
});

grpcServer.bindAsync(
  "0.0.0.0:50051",
  ServerCredentials.createInsecure(),
  () => {
    grpcServer.start();
    console.log("gRPC server running at http://localhost:50051");
  }
);
