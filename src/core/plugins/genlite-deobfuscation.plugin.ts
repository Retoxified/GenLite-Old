import { GenLitePlugin } from '../interfaces/plugin.interface';

export class GenLiteDeobfuscationPlugin implements GenLitePlugin {
  static pluginName = 'GenLiteDeobfuscationPlugin';

  propertyMappings = {
    'J4': 'GRAPHICS',
  };

  originalDefineProperty;

  public deobfuscationComplete: Promise<boolean>;
  private deobfuscationCompleteResolve;

  async init() {
    this.deobfuscationComplete = new Promise((resolve) => {
      this.deobfuscationCompleteResolve = resolve;
    });

    this.originalDefineProperty = Object.defineProperty;

    Object.defineProperty = (obj, prop, descriptor) => {
      for (const key of Object.keys(this.propertyMappings)) {
        const deobfuscatedName = this.propertyMappings[key];

        if (prop === key) {
          /** We found a known GenFanad object property */
          if (!window.GenFanad) {
            window.GenFanad = obj;
          }

          Object.defineProperty(window, deobfuscatedName, {
            get: function() {
              return window.GenFanad[key];
            }
          });
        }
      }

      /** Ensure reference to "this" is correct in windowHasAllMappedProperties call */
      if (this.windowHasAllMappedProperties()) {
        Object.defineProperty = this.originalDefineProperty;

        /** All expected property mappings found, resolving promise. */
        this.deobfuscationCompleteResolve();
      }

      return this.originalDefineProperty.call(Object, obj, prop, descriptor);
    };
  }

  windowHasAllMappedProperties() {
    let hasAll = true;

    for (const key of Object.keys(this.propertyMappings)) {
      const deobfuscatedName = this.propertyMappings[key];

      if (!window[deobfuscatedName]) {
        hasAll = false;
        break;
      }
    }

    return hasAll;
  }
}
