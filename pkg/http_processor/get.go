package http_processor

import (
	"errors"
	"fmt"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"net/http"
	"net/url"
	"reflect"
	"strconv"
)

// GetSafeQuery binds query + chi URL params + defaults and validates.
// Tags:
//
//	`query:"name"` — query param
//	`param:"name"` — chi route param
//	`default:"value"` — default when the param is missing
//	`validate:"required,..."` — validation
func GetSafeQuery(dst any) func(r *http.Request) error {
	v := reflect.ValueOf(dst)
	if v.Kind() != reflect.Ptr || v.Elem().Kind() != reflect.Struct {
		panic("GetSafeQuery: dst must be pointer to struct")
	}

	return func(r *http.Request) error {
		structVal := v.Elem()
		structType := structVal.Type()

		// 1. Bind query
		if err := bindFromValues(structVal, structType, r.URL.Query(), "query"); err != nil {
			return err
		}

		// 2. Bind chi params
		if routeCtx := chi.RouteContext(r.Context()); routeCtx != nil {
			if err := bindFromMap(structVal, structType, routeCtx.URLParams, "param"); err != nil {
				return err
			}
		}

		// 3. Apply defaults for unset fields
		if err := applyDefaults(structVal, structType); err != nil {
			return err
		}

		return ValidateStruct(dst)
	}
}

// bindFromValues binds from url.Values (query).
func bindFromValues(structVal reflect.Value, structType reflect.Type, values url.Values, tagName string) error {
	for i := 0; i < structVal.NumField(); i++ {
		field := structVal.Field(i)
		if !field.CanSet() {
			continue
		}
		sf := structType.Field(i)
		key := sf.Tag.Get(tagName)
		if key == "" || key == "-" {
			continue
		}

		paramVals := values[key]
		if len(paramVals) == 0 {
			continue
		}

		if err := setField(field, paramVals); err != nil {
			return fmt.Errorf("%s %s: %w", tagName, key, err)
		}
	}
	return nil
}

// bindFromMap binds from chi.URLParams (Keys/Values).
func bindFromMap(structVal reflect.Value, structType reflect.Type, urlParams chi.RouteParams, tagName string) error {
	for i := 0; i < structVal.NumField(); i++ {
		field := structVal.Field(i)
		if !field.CanSet() {
			continue
		}
		sf := structType.Field(i)
		key := sf.Tag.Get(tagName)
		if key == "" || key == "-" {
			continue
		}

		val := ""
		for j := range urlParams.Keys {
			if urlParams.Keys[j] == key {
				val = urlParams.Values[j]
				break
			}
		}
		if val == "" {
			continue
		}

		if err := setField(field, []string{val}); err != nil {
			return fmt.Errorf("%s %s: %w", tagName, key, err)
		}
	}
	return nil
}

// applyDefaults sets default values for fields that are still zero.
func applyDefaults(structVal reflect.Value, structType reflect.Type) error {
	for i := 0; i < structVal.NumField(); i++ {
		field := structVal.Field(i)
		if !field.CanSet() {
			continue
		}
		sf := structType.Field(i)
		defaultVal := sf.Tag.Get("default")
		if defaultVal == "" || defaultVal == "-" {
			continue
		}

		// Skip if the field is already set (non-zero)
		if !isZero(field) {
			continue
		}

		if err := setField(field, []string{defaultVal}); err != nil {
			return fmt.Errorf("default for %s: %w", sf.Name, err)
		}
	}
	return nil
}

// isZero checks whether the value is zero for its type.
func isZero(v reflect.Value) bool {
	switch v.Kind() {
	case reflect.String:
		return v.Len() == 0
	case reflect.Ptr, reflect.Interface, reflect.Slice, reflect.Map, reflect.Chan, reflect.Func:
		return v.IsNil()
	default:
		return v.IsZero()
	}
}

// setField is a generic field setter.
func setField(field reflect.Value, values []string) error {
	if len(values) == 0 {
		return errors.New("empty value")
	}

	if field.Kind() == reflect.Slice && field.Type().Elem().Kind() == reflect.String {
		field.Set(reflect.ValueOf(values))
		return nil
	}

	val := values[0]

	switch field.Kind() {
	case reflect.String:
		field.SetString(val)
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		i, err := strconv.ParseInt(val, 10, 64)
		if err != nil {
			return err
		}
		field.SetInt(i)
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		u, err := strconv.ParseUint(val, 10, 64)
		if err != nil {
			return err
		}
		field.SetUint(u)
	case reflect.Float32, reflect.Float64:
		f, err := strconv.ParseFloat(val, 64)
		if err != nil {
			return err
		}
		field.SetFloat(f)
	case reflect.Bool:
		b, err := strconv.ParseBool(val)
		if err != nil {
			return err
		}
		field.SetBool(b)
	case reflect.Ptr:
		if field.IsNil() {
			field.Set(reflect.New(field.Type().Elem()))
		}
		return setField(field.Elem(), values)
	case reflect.Struct:
		if field.Type() == reflect.TypeOf(pgtype.UUID{}) {
			var u pgtype.UUID
			if err := u.Scan(val); err != nil {
				return fmt.Errorf("invalid UUID: %w", err)
			}
			field.Set(reflect.ValueOf(u))
			return nil
		}
		if field.Type() == reflect.TypeOf(uuid.UUID{}) {
			var u uuid.UUID
			if err := u.Scan(val); err != nil {
				return fmt.Errorf("invalid UUID: %w", err)
			}
			field.Set(reflect.ValueOf(u))
			return nil
		}
		fallthrough
	default:
		return fmt.Errorf("unsupported field type %s", field.Type())
	}
	return nil
}
