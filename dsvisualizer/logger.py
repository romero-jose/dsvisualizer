from dsvisualizer.operations import (
    LinkedListOperation,
    Metadata,
    Operation,
    Operations,
    VisualizationMetadata,
)
from dsvisualizer.widget import OperationsWidget

_logger = None


def get_logger():
    global _logger
    return _logger


def set_logger(logger: "Logger"):
    global _logger
    _logger = logger


class Logger:
    def __init__(self, logger: "Logger" = None):
        self.visualized_upto = 0
        if logger:
            self.operations = logger.operations
        else:
            self.operations = Operations()

    def log(self, op: LinkedListOperation, source: str):
        self.operations.operations.append(
            Operation(operation=op, metadata=Metadata(animate=True, source=source))
        )

    def visualize(self):
        # Only animate operations that haven't been animated yet
        operations = Operations(
            operations=[
                Operation(
                    operation=o.operation,
                    metadata=Metadata(
                        animate=i >= self.visualized_upto, source=o.metadata.source
                    ),
                )
                for i, o in enumerate(self.operations.operations)
            ],
            # TODO: Fill in the metadata
            metadata=VisualizationMetadata(),
        )
        w = OperationsWidget()
        w.operations = operations
        self.visualized_upto = len(self.operations.operations)
        return w

    def copy(self):
        return Logger(self)

    def __enter__(self):
        self._saved_logger = get_logger()
        set_logger(self)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        set_logger(self._saved_logger)


def reset_logger():
    set_logger(Logger())


_logger = Logger()
