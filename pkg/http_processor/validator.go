package http_processor

import (
	"errors"
	"fmt"
	"github.com/go-playground/validator/v10"
	"strings"
	"sync"
)

var (
	validate *validator.Validate
	once     sync.Once
)

func getValidator() *validator.Validate {
	once.Do(func() {
		validate = validator.New(validator.WithRequiredStructEnabled())
	})
	return validate
}

// ValidationError is a custom error with details for the API.
type ValidationError struct {
	Details map[string]string
}

func (ve *ValidationError) Error() string {
	if len(ve.Details) == 0 {
		return "validation failed"
	}

	var sb strings.Builder
	sb.WriteString("validation failed: ")
	for field, msg := range ve.Details {
		sb.WriteString(fmt.Sprintf("%s - %s; ", field, msg))
	}
	return strings.TrimSuffix(sb.String(), "; ")
}

// ValidateStruct uses the JSON tag for field names in errors.
func ValidateStruct(ptr any) error {
	if ptr == nil {
		return nil
	}

	err := getValidator().Struct(ptr)
	if err == nil {
		return nil
	}

	var ve validator.ValidationErrors
	if !errors.As(err, &ve) {
		return err
	}

	details := make(map[string]string, len(ve))
	for _, fe := range ve {
		details[fe.Field()] = readableMessage(fe)
	}

	return &ValidationError{Details: details}
}

func readableMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "this field is required"
	case "uuid4":
		return "must be a valid UUID v4"
	case "email":
		return "must be a valid email address"
	case "min":
		return fmt.Sprintf("must be at least %s characters", fe.Param())
	case "max":
		return fmt.Sprintf("must be at most %s characters", fe.Param())
	case "gt":
		return fmt.Sprintf("must be greater than %s", fe.Param())
	case "gte":
		return fmt.Sprintf("must be greater than or equal to %s", fe.Param())
	case "lt":
		return fmt.Sprintf("must be less than %s", fe.Param())
	case "lte":
		return fmt.Sprintf("must be less than or equal to %s", fe.Param())
	case "oneof":
		return fmt.Sprintf("must be one of %s", fe.Param())
	default:
		return "invalid value"
	}
}
