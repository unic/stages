import { forwardRef } from "react";
import { Slider as SliderPrimitive } from "radix-ui";
import { cn, pickDOMProps } from "../../lib/utils";

export const Slider = forwardRef(function Slider({ className, value, defaultValue, label, secondaryText, prefix, suffix, error, isValidating, tooltipOptions, ...props }, ref) {
  const values = Array.isArray(value) ? value : value === undefined ? undefined : [value];
  const defaults = Array.isArray(defaultValue) ? defaultValue : defaultValue === undefined ? undefined : [defaultValue];
  return (
    <SliderPrimitive.Root ref={ref} className={cn("ui-slider", className)} value={values} defaultValue={defaults} {...pickDOMProps(props, ["disabled", "inverted", "max", "min", "minStepsBetweenThumbs", "orientation", "step"])}>
      <SliderPrimitive.Track className="ui-slider__track"><SliderPrimitive.Range className="ui-slider__range" /></SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="ui-slider__thumb" />
    </SliderPrimitive.Root>
  );
});
