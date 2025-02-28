import { createStack } from "../stack";
import { CftRequest } from "../types";

import { MethodCall, SpyFactory, SpyFactoryGetter } from "./spyTypes";

type SinonSpy = Function & {
  getCalls(): unknown[][];
  restore(): void;
};

declare type Sinon = {
  spy(callback: Function): SinonSpy;
};

declare const sinon: Sinon | undefined;

const isSinonModule = (spyLibrary: unknown): spyLibrary is Sinon => {
  return typeof spyLibrary === "object" && typeof (spyLibrary as Partial<Sinon>).spy === "function";
};

const createSinonSpyFactory = (spyLibrary: Sinon): SpyFactory => {
  return (container: any, methodName: string) => {
    const methodCalls: MethodCall[] = [];
    const originalMethod = container[methodName];

    const spyMethod = spyLibrary.spy(function (this: unknown, ...args: unknown[]) {
      methodCalls.push({
        args,
        stack: createStack(),
      });

      return originalMethod.apply(this, args);
    });

    container[methodName] = spyMethod;

    return {
      getCalls: () => methodCalls,
      restore() {
        container[methodName] = originalMethod;
      },
    };
  };
};

export const getSinonSpyFactory: SpyFactoryGetter = ({ spyLibrary }: CftRequest) => {
  if (isSinonModule(spyLibrary)) {
    return createSinonSpyFactory(spyLibrary);
  }

  if (typeof sinon !== "undefined" && isSinonModule(sinon)) {
    return createSinonSpyFactory(sinon);
  }

  return undefined;
};
