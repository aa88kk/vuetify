// Styles
import './VTextField.sass'

// Extensions
import VInput from '../VInput'

// Components
import VCounter from '../VCounter'
import VLabel from '../VLabel'

// Mixins
import Maskable from '../../mixins/maskable'
import Loadable from '../../mixins/loadable'

// Directives
import Ripple from '../../directives/ripple'

// Utilities
import { keyCodes } from '../../util/helpers'
import { deprecate } from '../../util/console'

// Types
import mixins, { ExtractVue } from '../../util/mixins'
import { VNode } from 'vue/types'
import Vue from 'vue'

interface options extends Vue {
  $refs: {
    input: HTMLInputElement
    prefix: HTMLElement
    suffix: HTMLElement
  }
}

const baseMixins = mixins<options &
  ExtractVue<[
    typeof VInput,
    typeof Maskable,
    typeof Loadable
  ]>
>(
  VInput,
  Maskable,
  Loadable
)

const dirtyTypes = ['color', 'file', 'time', 'date', 'datetime-local', 'week', 'month']

/* @vue/component */
export default baseMixins.extend({
  name: 'v-text-field',

  directives: { Ripple },

  inheritAttrs: false,

  props: {
    appendOuterIcon: String,
    autofocus: Boolean,
    /** @deprecated */
    box: Boolean,
    browserAutocomplete: String,
    clearable: Boolean,
    clearIcon: {
      type: String,
      default: '$vuetify.icons.clear'
    },
    color: {
      type: String,
      default: 'primary'
    },
    counter: [Boolean, Number, String],
    filled: Boolean,
    flat: Boolean,
    fullWidth: Boolean,
    label: String,
    outline: Boolean,
    outlined: Boolean,
    placeholder: String,
    prefix: String,
    prependInnerIcon: String,
    reverse: Boolean,
    singleLine: Boolean,
    solo: Boolean,
    soloInverted: Boolean,
    suffix: String,
    type: {
      type: String,
      default: 'text'
    }
  },

  data: () => ({
    badInput: false,
    initialValue: null,
    internalChange: false,
    isClearing: false
  }),

  computed: {
    classes (): object {
      return {
        ...VInput.options.computed.classes.call(this),
        'v-text-field': true,
        'v-text-field--full-width': this.fullWidth,
        'v-text-field--prefix': this.prefix,
        'v-text-field--single-line': this.isSingle,
        'v-text-field--solo': this.isSolo,
        'v-text-field--solo-inverted': this.soloInverted,
        'v-text-field--solo-flat': this.flat,
        'v-text-field--filled': this.filled,
        'v-text-field--enclosed': this.isEnclosed,
        'v-text-field--reverse': this.reverse,
        'v-text-field--outline': this.outline,
        'v-text-field--placeholder': this.placeholder
      }
    },
    counterValue (): number {
      return (this.internalValue || '').toString().length
    },
    internalValue: {
      get (): any {
        return this.lazyValue
      },
      set (val: any) {
        if (this.mask && val !== this.lazyValue) {
          this.lazyValue = this.unmaskText(this.maskText(this.unmaskText(val)))
          this.setSelectionRange()
        } else {
          this.lazyValue = val
          this.$emit('input', this.lazyValue)
        }
      }
    },
    isDirty (): boolean {
      return (this.lazyValue != null &&
        this.lazyValue.toString().length > 0) ||
        this.badInput
    },
    isEnclosed (): boolean {
      return (
        this.isFilled ||
        this.isSolo ||
        this.outline ||
        this.fullWidth
      )
    },
    isFilled (): boolean {
      return this.box || this.filled
    },
    isLabelActive (): boolean {
      return this.isDirty || dirtyTypes.includes(this.type)
    },
    isSingle (): boolean {
      return this.isSolo || this.singleLine
    },
    isSolo (): boolean {
      return this.solo || this.soloInverted
    },
    labelPosition (): Record<'left' | 'right', string | number | undefined> {
      const offset = (this.prefix && !this.labelValue) ? this.prefixWidth : 0

      return (this.$vuetify.rtl === this.reverse) ? {
        left: offset,
        right: 'auto'
      } : {
        left: 'auto',
        right: offset
      }
    },
    showLabel (): boolean {
      return this.hasLabel && (!this.isSingle || (!this.isLabelActive && !this.placeholder && !this.prefixLabel))
    },
    labelValue (): boolean {
      return !this.isSingle &&
        Boolean(this.isFocused || this.isLabelActive || this.placeholder || this.prefixLabel)
    },
    prefixWidth (): number | undefined {
      if (!this.prefix && !this.$refs.prefix) return

      return this.$refs.prefix.offsetWidth
    },
    prefixLabel (): boolean {
      return !!(this.prefix && !this.value)
    }
  },

  watch: {
    isFocused (val) {
      // Sets validationState from validatable
      this.hasColor = val

      if (val) {
        this.initialValue = this.lazyValue
      } else if (this.initialValue !== this.lazyValue) {
        this.$emit('change', this.lazyValue)
      }
    },
    value (val) {
      if (this.mask && !this.internalChange) {
        const masked = this.maskText(this.unmaskText(val))
        this.lazyValue = this.unmaskText(masked)

        // Emit when the externally set value was modified internally
        String(val) !== this.lazyValue && this.$nextTick(() => {
          this.$refs.input.value = masked
          this.$emit('input', this.lazyValue)
        })
      } else this.lazyValue = val
    }
  },

  created () {
    /* istanbul ignore if */
    if (this.outline) deprecate('outline', 'outlined')
    if (this.box) deprecate('box', 'filled')
  },

  mounted () {
    this.autofocus && this.onFocus()
  },

  methods: {
    /** @public */
    focus () {
      this.onFocus()
    },
    /** @public */
    blur () {
      this.$refs.input ? this.$refs.input.blur() : this.onBlur()
    },
    clearableCallback () {
      this.internalValue = null
      this.$nextTick(() => this.$refs.input.focus())
    },
    genAppendSlot () {
      const slot = []

      if (this.$slots['append-outer']) {
        slot.push(this.$slots['append-outer'] as VNode[])
      } else if (this.appendOuterIcon) {
        slot.push(this.genIcon('appendOuter'))
      }

      return this.genSlot('append', 'outer', slot)
    },
    genPrependInnerSlot () {
      const slot = []

      if (this.$slots['prepend-inner']) {
        slot.push(this.$slots['prepend-inner'] as VNode[])
      } else if (this.prependInnerIcon) {
        slot.push(this.genIcon('prependInner'))
      }

      return this.genSlot('prepend', 'inner', slot)
    },
    genIconSlot () {
      const slot = []

      if (this.$slots['append']) {
        slot.push(this.$slots['append'] as VNode[])
      } else if (this.appendIcon) {
        slot.push(this.genIcon('append'))
      }

      return this.genSlot('append', 'inner', slot)
    },
    genInputSlot () {
      const input = VInput.options.methods.genInputSlot.call(this)

      const prepend = this.genPrependInnerSlot()

      if (prepend) {
        input.children = input.children || []
        input.children.unshift(prepend)
      }

      return input
    },
    genClearIcon () {
      if (!this.clearable) return null

      const icon = this.isDirty ? 'clear' : ''

      return this.genSlot('append', 'inner', [
        this.genIcon(
          icon,
          this.clearableCallback
        )
      ])
    },
    genCounter () {
      if (this.counter === false || this.counter == null) return null

      const max = this.counter === true ? this.$attrs.maxlength : this.counter

      return this.$createElement(VCounter, {
        props: {
          dark: this.dark,
          light: this.light,
          max,
          value: this.counterValue
        }
      })
    },
    genDefaultSlot () {
      return [
        this.genTextFieldSlot(),
        this.genClearIcon(),
        this.genIconSlot(),
        this.genProgress()
      ]
    },
    genLabel () {
      if (!this.showLabel) return null

      const data = {
        props: {
          absolute: true,
          color: this.validationState,
          dark: this.dark,
          disabled: this.disabled,
          focused: !this.isSingle && (this.isFocused || !!this.validationState),
          for: this.$attrs.id,
          left: this.labelPosition.left,
          light: this.light,
          right: this.labelPosition.right,
          value: this.labelValue
        }
      }

      return this.$createElement(VLabel, data, this.$slots.label || this.label)
    },
    genInput () {
      const listeners = Object.assign({}, this.$listeners)
      delete listeners['change'] // Change should not be bound externally

      return this.$createElement('input', {
        style: {},
        domProps: {
          value: this.maskText(this.lazyValue)
        },
        attrs: {
          'aria-label': (!this.$attrs || !this.$attrs.id) && this.label, // Label `for` will be set if we have an id
          maxlength: this.mask ? this.masked.length : undefined,
          ...this.$attrs,
          autocomplete: this.browserAutocomplete,
          autofocus: this.autofocus,
          disabled: this.disabled,
          placeholder: this.placeholder,
          readonly: this.readonly,
          type: this.type
        },
        on: Object.assign(listeners, {
          blur: this.onBlur,
          input: this.onInput,
          focus: this.onFocus,
          keydown: this.onKeyDown
        }),
        ref: 'input'
      })
    },
    genMessages () {
      if (this.hideDetails) return null

      return this.$createElement('div', {
        staticClass: 'v-text-field__details'
      }, [
        VInput.options.methods.genMessages.call(this),
        this.genCounter()
      ])
    },
    genTextFieldSlot () {
      return this.$createElement('div', {
        staticClass: 'v-text-field__slot'
      }, [
        this.genLabel(),
        this.prefix ? this.genAffix('prefix') : null,
        this.genInput(),
        this.suffix ? this.genAffix('suffix') : null
      ])
    },
    genAffix (type: 'prefix' | 'suffix') {
      return this.$createElement('div', {
        'class': `v-text-field__${type}`,
        ref: type
      }, this[type])
    },
    onBlur (e?: Event) {
      this.isFocused = false
      // Reset internalChange state
      // to allow external change
      // to persist
      this.internalChange = false

      this.$emit('blur', e)
    },
    onClick () {
      if (this.isFocused || this.disabled) return

      this.$refs.input.focus()
    },
    onFocus (e?: Event) {
      if (!this.$refs.input) return

      if (document.activeElement !== this.$refs.input) {
        return this.$refs.input.focus()
      }

      if (!this.isFocused) {
        this.isFocused = true
        e && this.$emit('focus', e)
      }
    },
    onInput (e: Event) {
      const target = e.target as HTMLInputElement
      this.internalChange = true
      this.mask && this.resetSelections(target)
      this.internalValue = target.value
      this.badInput = target.validity && target.validity.badInput
    },
    onKeyDown (e: KeyboardEvent) {
      this.internalChange = true

      if (e.keyCode === keyCodes.enter) this.$emit('change', this.internalValue)

      this.$emit('keydown', e)
    },
    onMouseDown (e: Event) {
      // Prevent input from being blurred
      if (e.target !== this.$refs.input) {
        e.preventDefault()
        e.stopPropagation()
      }

      VInput.options.methods.onMouseDown.call(this, e)
    },
    onMouseUp (e: Event) {
      if (this.hasMouseDown) this.focus()

      VInput.options.methods.onMouseUp.call(this, e)
    }
  }
})
