$(shell python3 tools/spoof/gen_profiles.py)
PRODUCT_NAME := aosp_emuhub
PRODUCT_DEVICE := emuhub
PRODUCT_BRAND := Android
PRODUCT_MODEL := EmuHub
PRODUCT_MANUFACTURER := emuhub
$(call inherit-product, device/emuhub/emuhub/device.mk)
ifneq ($(SPOOF_PROFILE),)
  $(info Using spoof profile: $(SPOOF_PROFILE))
  include device/emuhub/spoof/$(SPOOF_PROFILE)/props.mk
endif
