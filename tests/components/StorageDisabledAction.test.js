import { createLocalVue, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import Buefy from "buefy";
import StorageDisabledAction from "~/components/storage/StorageDisabledAction.vue";
import SampleList from "~/components/samples/SampleList.vue";
import RunList from "~/components/runs/RunList.vue";
import Sample from "~/pages/sample.vue";
import Run from "~/pages/run.vue";
import { storageReadOnlyMessage } from "~/utils/storageState";

const localVue = createLocalVue();
localVue.use(Buefy);
const storage = (state) => ({
  state,
  acceptsHpcWrites: state === "hpc",
  authoritativeLocation: ["hpc", "migrating"].includes(state) ? "hpc" : "s3",
  s3Uri: state === "hpc" ? null : "s3://archive/project",
});

describe("disabled storage actions", () => {
  it.each(["migrating", "aws_pending_hpc_deletion", "aws"])(
    "shows an accessible explanation and a non-interactive button for %s",
    (state) => {
      const wrapper = mount(StorageDisabledAction, {
        localVue,
        propsData: { storage: storage(state), descriptionId: "reason" },
        slots: { default: "Clone data for new Run" },
      });
      const action = wrapper.find('[tabindex="0"]');
      expect(action.attributes("role")).toBe("button");
      expect(action.attributes("aria-disabled")).toBe("true");
      expect(
        wrapper.find(`#${action.attributes("aria-labelledby")}`).text()
      ).toBe("Clone data for new Run");
      const button = wrapper.find("button");
      expect(button.element.disabled).toBe(true);
      expect(button.attributes("aria-describedby")).toBe("reason");
      expect(
        wrapper.find('[tabindex="0"]').attributes("aria-describedby")
      ).toBe("reason");
      expect(wrapper.find("#reason").text()).toBe(
        storageReadOnlyMessage(storage(state))
      );
      expect(wrapper.findComponent({ name: "BTooltip" }).props("label")).toBe(
        storageReadOnlyMessage(storage(state))
      );
      wrapper.destroy();
    }
  );

  it.each([
    [SampleList, "project", "samples"],
    [RunList, "sample", "runs"],
  ])(
    "replaces a New link with a disabled explanatory button",
    (component, parent, collection) => {
      const wrapper = mount(component, {
        localVue,
        propsData: {
          [parent]: { _id: "entity" },
          [collection]: [],
          projectStorage: storage("aws"),
          showNewButton: true,
        },
        mocks: { $store: { state: { groups: [] } } },
        stubs: { "nuxt-link": { template: "<a><slot /></a>" } },
      });
      expect(wrapper.find("a").exists()).toBe(false);
      expect(wrapper.find("button").element.disabled).toBe(true);
      expect(wrapper.text()).toContain("This project is archived in AWS");
      wrapper.setProps({ projectStorage: storage("hpc") });
      return wrapper.vm.$nextTick().then(() => {
        expect(wrapper.find("a").text()).toBe("New");
        expect(wrapper.find("button").exists()).toBe(false);
        wrapper.destroy();
      });
    }
  );

  it.each([
    [Sample, "cloneSample"],
    [Run, "cloneRun"],
  ])(
    "also refuses a clone invoked directly on a read-only page",
    (page, method) => {
      const push = vi.fn();
      const toast = vi.fn();
      page.methods[method].call({
        storageDescription: { readOnly: true },
        $router: { push },
        $buefy: { toast: { open: toast } },
      });
      expect(push).not.toHaveBeenCalled();
    }
  );
});
